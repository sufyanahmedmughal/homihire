import api from './api';

/**
 * Admin Login
 * POST /api/auth/admin/login
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, admin: object }}
 */
export const adminLogin = async (email, password) => {
    const response = await api.post('/api/auth/admin/login', { email, password });
    return response.data;
};

/**
 * Get currently authenticated admin profile
 * GET /api/auth/me
 */
export const getMe = async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
};
