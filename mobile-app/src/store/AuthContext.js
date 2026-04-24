import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe, updateFcmToken } from '../services/api';
import { getFCMToken, setupNotificationChannel } from '../services/notifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'user' | 'worker' | 'admin'
  const [loading, setLoading] = useState(true);

  // ─── Restore session on app launch ──────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, storedRole, storedProfile] = await AsyncStorage.multiGet([
          'auth_token', 'user_role', 'user_profile',
        ]);
        const t = storedToken[1];
        const r = storedRole[1];
        const p = storedProfile[1];

        if (t && r) {
          setToken(t);
          setRole(r);
          if (p) setUser(JSON.parse(p));

          // Refresh profile from server to get latest status
          try {
            const fresh = await getMe();
            if (fresh?.user || fresh?.worker) {
              const profile = fresh.user || fresh.worker;
              setUser(profile);
              await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
            }
          } catch (_) {
            // Use cached profile if network fails
          }
        }
      } catch (_) {
        // ignore — session expired or corrupted
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ─── Register FCM token after a worker logs in ───────────────────────────
  const registerFCMToken = useCallback(async (userRole) => {
    if (userRole !== 'worker') return;
    try {
      await setupNotificationChannel();
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        await updateFcmToken(fcmToken);
        console.log('[AuthContext] FCM token registered with backend ✓');
      }
    } catch (e) {
      // Non-fatal — backend push still works without this in dev
      console.warn('[AuthContext] FCM token registration failed:', e.message);
    }
  }, []);

  // ─── Login ───────────────────────────────────────────────────────────────
  const login = useCallback(async ({ token: newToken, role: newRole, profile }) => {
    await AsyncStorage.multiSet([
      ['auth_token', newToken],
      ['user_role', newRole],
      ['user_profile', JSON.stringify(profile)],
    ]);
    setToken(newToken);
    setRole(newRole);
    setUser(profile);
    // Register FCM token in background (don't block login)
    registerFCMToken(newRole);
  }, [registerFCMToken]);

  // ─── Logout ──────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['auth_token', 'user_role', 'user_profile']);
    setToken(null);
    setRole(null);
    setUser(null);
  }, []);

  // ─── Update user profile in context + storage ────────────────────────────
  const updateUser = useCallback(async (updatedProfile) => {
    setUser(updatedProfile);
    try {
      await AsyncStorage.setItem('user_profile', JSON.stringify(updatedProfile));
    } catch (_) {}
  }, []);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{
      token, user, role, loading,
      isAuthenticated, login, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
