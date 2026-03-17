import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminLogin as loginAPI } from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'hh_admin_token';
const USER_KEY = 'hh_admin_user';

export function AuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true); // true while restoring session

    // Restore session from localStorage on mount
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);
            if (storedToken && storedUser) {
                setToken(storedToken);
                setAdmin(JSON.parse(storedUser));
            }
        } catch {
            // Corrupted storage — clear it
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Login — calls API, stores token + user in localStorage
     */
    const login = useCallback(async (email, password) => {
        const data = await loginAPI(email, password);
        const { token: newToken, admin: adminData } = data;

        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(adminData));
        setToken(newToken);
        setAdmin(adminData);
        return adminData;
    }, []);

    /**
     * Logout — clears all session data
     */
    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setAdmin(null);
    }, []);

    const isAuthenticated = !!token && !!admin;

    const value = {
        admin,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }
    return ctx;
}
