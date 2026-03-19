import api from './api';

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Cached 5 min on backend (Redis).
 */
export const getStats = async () => {
    const res = await api.get('/api/admin/stats');
    return res.data;
};

// ─── Pending Workers ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/workers/pending
 * Cursor-paginated list of pending workers.
 * @param {{ limit?: number, cursor?: string }} opts
 */
export const getPendingWorkers = async ({ limit = 20, cursor } = {}) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    const res = await api.get('/api/admin/workers/pending', { params });
    return res.data;
};

// ─── Workers ──────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/workers
 * All workers with optional status / skills filter — cursor paginated.
 * @param {{ limit?: number, cursor?: string, status?: string, skill?: string }} opts
 */
export const getWorkers = async ({ limit = 20, cursor, status, skill } = {}) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    if (status) params.status = status;
    if (skill)  params.skill  = skill;
    const res = await api.get('/api/admin/workers', { params });
    return res.data;
};

/**
 * PUT /api/admin/workers/:id/approve
 * @param {string} workerId
 * @param {string} note
 */
export const approveWorker = async (workerId, note) => {
    const res = await api.put(`/api/admin/workers/${workerId}/approve`, { note });
    return res.data;
};

/**
 * PUT /api/admin/workers/:id/reject
 * @param {string} workerId
 * @param {string} rejection_reason  — required by backend
 */
export const rejectWorker = async (workerId, rejection_reason) => {
    const res = await api.put(`/api/admin/workers/${workerId}/reject`, { rejection_reason });
    return res.data;
};

/**
 * PUT /api/admin/workers/:id/block
 * @param {string} workerId
 */
export const blockWorker = async (workerId) => {
    const res = await api.put(`/api/admin/workers/${workerId}/block`);
    return res.data;
};

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * All users — cursor paginated, optional search / status filter.
 * @param {{ limit?: number, cursor?: string, status?: string, search?: string }} opts
 */
export const getUsers = async ({ limit = 20, cursor, status, search } = {}) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    if (status) params.status = status;
    if (search) params.search = search;
    const res = await api.get('/api/admin/users', { params });
    return res.data;
};

/**
 * PUT /api/admin/users/:id/block
 * @param {string} userId
 */
export const blockUser = async (userId) => {
    const res = await api.put(`/api/admin/users/${userId}/block`);
    return res.data;
};
