const express = require('express');
const router = express.Router();

const {
    getPendingWorkers,
    getWorkerById,
    approveWorker,
    rejectWorker,
    blockWorker,
    getAllUsers,
    blockUser,
    getAllWorkers,
    getDashboardStats,
    getRecentNotifications,
} = require('../controllers/admin.controller');

const { authenticate, authorizeRoles } = require('../middleware/auth');
const { sanitizeInput, globalRateLimiter } = require('../middleware/security');

// ─────────────────────────────────────────────────────────────────────
// ADMIN MIDDLEWARE — applied to every route in this router
// All /api/admin/* routes require a valid admin JWT
// v3 spec Section 2.5: "Only admins with valid admin JWT can access /api/admin/*"
// ─────────────────────────────────────────────────────────────────────
router.use(authenticate);
router.use(authorizeRoles('admin'));

// ─────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// GET /api/admin/stats
// Cached 5 minutes in Redis
// Response: { total_users, total_workers:{approved,pending,rejected,blocked},
//             total_jobs:{pending,in_progress,completed,cancelled}, cached_at }
// ─────────────────────────────────────────────────────────────────────
router.get('/stats', getDashboardStats);

// ─────────────────────────────────────────────────────────────────────
// WORKER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/workers/pending
 * List all pending workers — cursor paginated
 * Query: ?limit=20&cursor=<last_id>
 */
router.get('/workers/pending', getPendingWorkers);

/**
 * GET /api/admin/workers
 * List all workers with optional filters
 * Query: ?limit=20&cursor=<last_id>&status=pending|approved|rejected|blocked&skills=Plumbing&search=name
 */
router.get('/workers', getAllWorkers);

/**
 * GET /api/admin/workers/:id
 * Get full worker profile by ID
 */
router.get('/workers/:id', getWorkerById);

/**
 * PUT /api/admin/workers/:id/approve
 * Approve a pending worker
 * Body: { "note": "Verified CNIC and selfie successfully" }
 * Response: { success, message, worker: { _id, name, status } }
 */
router.put('/workers/:id/approve', sanitizeInput, approveWorker);

/**
 * PUT /api/admin/workers/:id/reject
 * Reject a pending worker — rejection_reason REQUIRED
 * Body: { "rejection_reason": "CNIC image is blurry..." }
 * Response: { success, message, worker: { _id, name, status, rejection_reason } }
 */
router.put('/workers/:id/reject', sanitizeInput, rejectWorker);

/**
 * PUT /api/admin/workers/:id/block
 * Block a worker (any status) — active in_progress jobs → worker_removed
 * Body: { "reason": "..." } (optional)
 * Response: { success, message, affected_jobs: N }
 */
router.put('/workers/:id/block', sanitizeInput, blockWorker);

// ─────────────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * List all users — cursor paginated, filterable
 * Query: ?limit=20&cursor=<last_id>&status=active|blocked&search=<name>
 */
router.get('/users', getAllUsers);

/**
 * PUT /api/admin/users/:id/block
 * Block a user — they get 403 on next API call
 * Body: { "reason": "..." } (optional)
 * Response: { success, message, user: { _id, name, status } }
 */
router.put('/users/:id/block', sanitizeInput, blockUser);

// ─────────────────────────────────────────────────────────────────────
// NOTIFICATIONS (audit trail)
// ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/notifications
 * List recent notifications — cursor paginated
 * Query: ?limit=20&cursor=<id>&type=worker_approved|worker_rejected|...
 */
router.get('/notifications', getRecentNotifications);

module.exports = router;
