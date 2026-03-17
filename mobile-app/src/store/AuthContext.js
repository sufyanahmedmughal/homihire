import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'user' | 'worker' | 'admin'
  const [loading, setLoading] = useState(true);

  // Restore session on app launch
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
        }
      } catch (_) {
        // ignore — session expired or corrupted
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async ({ token: newToken, role: newRole, profile }) => {
    await AsyncStorage.multiSet([
      ['auth_token', newToken],
      ['user_role', newRole],
      ['user_profile', JSON.stringify(profile)],
    ]);
    setToken(newToken);
    setRole(newRole);
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['auth_token', 'user_role', 'user_profile']);
    setToken(null);
    setRole(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, role, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
