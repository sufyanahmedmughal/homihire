import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminStats = async () => {
    const res = await api.get('/api/admin/stats');
    return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// WORKERS
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingWorkers = async ({ cursor, limit = 20 } = {}) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    const res = await api.get('/api/admin/workers/pending', { params });
    return res.data;
};

export const getAllWorkers = async ({ cursor, limit = 20, status, skill } = {}) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    if (status) params.status = status;
    if (skill) params.skill = skill;
    const res = await api.get('/api/admin/workers', { params });
    return res.data;
};

export const approveWorker = async (id, note = '') => {
    const res = await api.put(`/api/admin/workers/${id}/approve`, { note });
    return res.data;
};

export const rejectWorker = async (id, rejection_reason) => {
    const res = await api.put(`/api/admin/workers/${id}/reject`, { rejection_reason });
    return res.data;
};

export const blockWorker = async (id) => {
    const res = await api.put(`/api/admin/workers/${id}/block`);
    return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────
export const getAllUsers = async ({ cursor, limit = 20, status } = {}) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    if (status) params.status = status;
    const res = await api.get('/api/admin/users', { params });
    return res.data;
};

export const blockUser = async (id) => {
    const res = await api.put(`/api/admin/users/${id}/block`);
    return res.data;
};
