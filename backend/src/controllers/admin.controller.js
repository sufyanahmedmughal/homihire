const { Worker } = require('../models/Worker');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const { createAndSendNotification } = require('../utils/fcm');
const { cacheGet, cacheSet, cacheDel, CACHE_KEYS, CACHE_TTL } = require('../config/redis');

// ─────────────────────────────────────────────────────────────────────
// HELPER — build cursor-paginated response
// v3 spec Section 4.4 — cursor = last item _id
// ─────────────────────────────────────────────────────────────────────
const paginateResult = (items, limit) => {
    const hasMore = items.length > limit;
    if (hasMore) items.pop(); // Remove the +1 extra item
    const nextCursor = hasMore ? items[items.length - 1]._id : null;
    return { items, hasMore, nextCursor };
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/workers/pending
// List all pending workers — cursor paginated — admin only
// Query: ?limit=20&cursor=<last_id>
// ─────────────────────────────────────────────────────────────────────
const getPendingWorkers = async (req, res) => {
    try {
        let limit = parseInt(req.query.limit) || 20;
        if (limit < 1) limit = 1;
        if (limit > 50) limit = 50;

        const cursor = req.query.cursor || null;

        const query = { status: 'pending' };
        if (cursor) {
            query._id = { $lt: cursor }; // cursor-based: fetch items older than cursor
        }

        const workers = await Worker.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1) // +1 trick
            .select('name cnic phone selfie_url cnic_front_url cnic_back_url skills fee location status rejection_reason createdAt admin_note');

        const { items, hasMore, nextCursor } = paginateResult(workers, limit);

        // Format location for easier client-side use
        const formatted = items.map((w) => ({
            _id: w._id,
            name: w.name,
            cnic: w.cnic,
            phone: w.phone,
            selfie_url: w.selfie_url,
            cnic_front_url: w.cnic_front_url,
            cnic_back_url: w.cnic_back_url,
            skills: w.skills,
            fee: w.fee,
            location: {
                lat: w.location?.coordinates[1],
                lng: w.location?.coordinates[0],
            },
            status: w.status,
            rejection_reason: w.rejection_reason,
            registered_at: w.createdAt,
        }));

        res.status(200).json({
            success: true,
            data: formatted,
            pagination: {
                has_more: hasMore,
                next_cursor: nextCursor,
                limit,
            },
        });
    } catch (error) {
        console.error('[getPendingWorkers]', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch pending workers' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/workers/:id
// Get full worker details by ID — admin only
// ─────────────────────────────────────────────────────────────────────
const getWorkerById = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id).select('-__v');
        if (!worker) {
            return res.status(404).json({ success: false, message: 'Worker not found' });
        }

        res.status(200).json({
            success: true,
            worker: {
                _id: worker._id,
                name: worker.name,
                cnic: worker.cnic,
                phone: worker.phone,
                selfie_url: worker.selfie_url,
                cnic_front_url: worker.cnic_front_url,
                cnic_back_url: worker.cnic_back_url,
                skills: worker.skills,
                fee: worker.fee,
                location: {
                    lat: worker.location?.coordinates[1],
                    lng: worker.location?.coordinates[0],
                },
                status: worker.status,
                rejection_reason: worker.rejection_reason,
                admin_note: worker.admin_note,
                is_available: worker.is_available,
                rating: worker.rating,
                total_jobs: worker.total_jobs,
                fcm_token: worker.fcm_token,
                registered_at: worker.createdAt,
                updatedAt: worker.updatedAt,
            },
        });
    } catch (error) {
        console.error('[getWorkerById]', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch worker' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// PUT /api/admin/workers/:id/approve
// Approve a pending worker — admin only
// Body: { "note": "Verified CNIC and selfie successfully" }
// ─────────────────────────────────────────────────────────────────────
const approveWorker = async (req, res) => {
    try {
        const { note } = req.body;

        const worker = await Worker.findById(req.params.id);
        if (!worker) {
            return res.status(404).json({ success: false, message: 'Worker not found' });
        }

        if (worker.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Worker status is '${worker.status}'. Only pending workers can be approved.`,
            });
        }

        // Update worker status to approved
        worker.status = 'approved';
        worker.is_available = true; // worker becomes available for jobs immediately
        if (note) worker.admin_note = note.trim();
        await worker.save();

        // Invalidate stats cache — worker count changed
        await cacheDel(CACHE_KEYS.ADMIN_STATS);

        // Send push notification to worker (fire-and-forget)
        createAndSendNotification({
            type: 'worker_approved',
            title: '🎉 Account Approved!',
            body: 'Your worker account has been approved. You can now start receiving job requests.',
            worker_id: worker._id,
            fcm_token: worker.fcm_token,
            data: { worker_id: String(worker._id) },
        });

        res.status(200).json({
            success: true,
            message: 'Worker approved successfully',
            worker: {
                _id: worker._id,
                name: worker.name,
                status: worker.status,
                is_available: worker.is_available,
            },
        });
    } catch (error) {
        console.error('[approveWorker]', error.message);
        res.status(500).json({ success: false, message: 'Failed to approve worker' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// PUT /api/admin/workers/:id/reject
// Reject a pending worker — admin only
// Body: { "rejection_reason": "CNIC image is blurry..." }
// rejection_reason is REQUIRED — v3 spec Section 2.5
// ─────────────────────────────────────────────────────────────────────
const rejectWorker = async (req, res) => {
    try {
        const { rejection_reason } = req.body;

        // rejection_reason is required — v3 spec Section 2.5
        if (!rejection_reason || !rejection_reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'rejection_reason is required when rejecting a worker',
            });
        }
        if (rejection_reason.trim().length > 500) {
            return res.status(400).json({
                success: false,
                message: 'rejection_reason must not exceed 500 characters',
            });
        }

        const worker = await Worker.findById(req.params.id);
        if (!worker) {
            return res.status(404).json({ success: false, message: 'Worker not found' });
        }

        if (worker.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Worker status is '${worker.status}'. Only pending workers can be rejected.`,
            });
        }

        worker.status = 'rejected';
        worker.rejection_reason = rejection_reason.trim();
        await worker.save();

        // Invalidate stats cache
        await cacheDel(CACHE_KEYS.ADMIN_STATS);

        // Push notification to worker (fire-and-forget)
        createAndSendNotification({
            type: 'worker_rejected',
            title: 'Registration Not Approved',
            body: `Your registration was not approved. Reason: ${rejection_reason.trim()}`,
            worker_id: worker._id,
            fcm_token: worker.fcm_token,
            data: {
                worker_id: String(worker._id),
                rejection_reason: rejection_reason.trim(),
            },
        });

        res.status(200).json({
            success: true,
            message: 'Worker rejected',
            worker: {
                _id: worker._id,
                name: worker.name,
                status: worker.status,
                rejection_reason: worker.rejection_reason,
            },
        });
    } catch (error) {
        console.error('[rejectWorker]', error.message);
        res.status(500).json({ success: false, message: 'Failed to reject worker' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// PUT /api/admin/workers/:id/block
// Block a worker — admin only
// v3 spec Section 2.5:
//   - worker.status = 'blocked'
//   - all active jobs (in_progress) → status 'worker_removed'
//   - NO auto-reassign — user notified to hire another worker
// ─────────────────────────────────────────────────────────────────────
const blockWorker = async (req, res) => {
    try {
        const { reason } = req.body;

        const worker = await Worker.findById(req.params.id);
        if (!worker) {
            return res.status(404).json({ success: false, message: 'Worker not found' });
        }

        if (worker.status === 'blocked') {
            return res.status(400).json({
                success: false,
                message: 'Worker is already blocked',
            });
        }

        // Block worker
        worker.status = 'blocked';
        worker.is_available = false;
        if (reason) worker.admin_note = reason.trim();
        await worker.save();

        // Invalidate stats cache
        await cacheDel(CACHE_KEYS.ADMIN_STATS);

        // Set active jobs to worker_removed — import Job model lazily to avoid circular deps
        const Job = require('../models/Job');
        const affectedJobs = await Job.find({
            worker_id: worker._id,
            status: 'in_progress',
        }).select('_id user_id');

        let affectedCount = 0;
        if (affectedJobs.length > 0) {
            // Bulk update all in_progress jobs
            await Job.updateMany(
                { worker_id: worker._id, status: 'in_progress' },
                {
                    $set: {
                        status: 'worker_removed',
                        worker_removed_at: new Date(),
                        worker_removed_reason: 'Worker account was blocked by admin',
                    },
                }
            );
            affectedCount = affectedJobs.length;

            // Notify each affected user (fire-and-forget)
            for (const job of affectedJobs) {
                if (job.user_id) {
                    const affectedUser = await User.findById(job.user_id).select('fcm_token');
                    createAndSendNotification({
                        type: 'job_worker_removed',
                        title: 'Worker Removed',
                        body: 'Your worker was removed by admin. Please hire another worker for your job.',
                        user_id: job.user_id,
                        fcm_token: affectedUser?.fcm_token,
                        data: { job_id: String(job._id) },
                    });
                }
            }
        }

        // Push notification to worker (fire-and-forget)
        createAndSendNotification({
            type: 'worker_blocked',
            title: 'Account Blocked',
            body: 'Your account has been blocked by admin. Please contact support.',
            worker_id: worker._id,
            fcm_token: worker.fcm_token,
            data: { worker_id: String(worker._id) },
        });

        res.status(200).json({
            success: true,
            message: 'Worker blocked. Active jobs set to worker_removed.',
            affected_jobs: affectedCount,
        });
    } catch (error) {
        console.error('[blockWorker]', error.message);
        res.status(500).json({ success: false, message: 'Failed to block worker' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// List all users — cursor paginated — admin only
// Query: ?limit=20&cursor=<id>&status=active|blocked&search=<name>
// ─────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        let limit = parseInt(req.query.limit) || 20;
        if (limit < 1) limit = 1;
        if (limit > 50) limit = 50;

        const cursor = req.query.cursor || null;
        const status = req.query.status || null;
        const search = req.query.search || null;

        const query = {};
        if (cursor) query._id = { $lt: cursor };
        if (status && ['active', 'blocked'].includes(status)) query.status = status;
        if (search && search.trim()) {
            query.name = { $regex: search.trim(), $options: 'i' };
        }

        const users = await User.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .select('name phone profile_picture status fcm_token createdAt');

        const { items, hasMore, nextCursor } = paginateResult(users, limit);

        res.status(200).json({
            success: true,
            data: items.map((u) => ({
                _id: u._id,
                name: u.name,
                phone: u.phone,
                profile_picture: u.profile_picture,
                status: u.status,
                registered_at: u.createdAt,
            })),
            pagination: {
                has_more: hasMore,
                next_cursor: nextCursor,
                limit,
            },
        });
    } catch (error) {
        console.error('[getAllUsers]', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/block
// Block a user — admin only
// v3 spec Section 2.5: status = 'blocked' → cannot login (403)
// ─────────────────────────────────────────────────────────────────────
const blockUser = async (req, res) => {
    try {
        const { reason } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.status === 'blocked') {
            return res.status(400).json({ success: false, message: 'User is already blocked' });
        }

        user.status = 'blocked';
        await user.save();

        // Invalidate stats cache
        await cacheDel(CACHE_KEYS.ADMIN_STATS);

        // Push notification (fire-and-forget)
        createAndSendNotification({
            type: 'user_blocked',
            title: 'Account Blocked',
            body: 'Your account has been blocked by admin. Please contact support.',
            user_id: user._id,
            fcm_token: user.fcm_token,
            data: { reason: reason || '' },
        });

        res.status(200).json({
            success: true,
            message: 'User blocked successfully',
            user: { _id: user._id, name: user.name, status: user.status },
        });
    } catch (error) {
        console.error('[blockUser]', error.message);
        res.status(500).json({ success: false, message: 'Failed to block user' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/workers
// List all workers — cursor paginated, filterable — admin only
// Query: ?limit=20&cursor=<id>&status=pending|approved|rejected|blocked&skills=Plumbing
// ─────────────────────────────────────────────────────────────────────
const getAllWorkers = async (req, res) => {
    try {
        let limit = parseInt(req.query.limit) || 20;
        if (limit < 1) limit = 1;
        if (limit > 50) limit = 50;

        const cursor = req.query.cursor || null;
        const status = req.query.status || null;
        const skills = req.query.skills || null;
        const search = req.query.search || null;

        const query = {};
        if (cursor) query._id = { $lt: cursor };
        if (status && ['pending', 'approved', 'rejected', 'blocked'].includes(status)) {
            query.status = status;
        }
        if (skills) {
            query.skills = { $in: [skills] };
        }
        if (search && search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { phone: { $regex: search.trim(), $options: 'i' } },
            ];
        }

        const workers = await Worker.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .select('name cnic phone selfie_url cnic_front_url cnic_back_url skills fee status rejection_reason rating total_jobs is_available createdAt');

        const { items, hasMore, nextCursor } = paginateResult(workers, limit);

        res.status(200).json({
            success: true,
            data: items.map((w) => ({
                _id: w._id,
                name: w.name,
                cnic: w.cnic,
                phone: w.phone,
                selfie_url: w.selfie_url,
                cnic_front_url: w.cnic_front_url,
                cnic_back_url: w.cnic_back_url,
                skills: w.skills,
                fee: w.fee,
                status: w.status,
                rejection_reason: w.rejection_reason,
                rating: w.rating,
                total_jobs: w.total_jobs,
                is_available: w.is_available,
                registered_at: w.createdAt,
            })),
            pagination: {
                has_more: hasMore,
                next_cursor: nextCursor,
                limit,
            },
        });
    } catch (error) {
        console.error('[getAllWorkers]', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch workers' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Dashboard stats — Redis cached 5 minutes — admin only
// v3 spec Section 2.4 Response Contract
// ─────────────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        // Check Redis cache first
        const cached = await cacheGet(CACHE_KEYS.ADMIN_STATS);
        if (cached) {
            return res.status(200).json({
                success: true,
                ...cached,
                from_cache: true,
            });
        }

        // Import Job lazily — model only exists after Slice 3, handle gracefully
        let jobCounts = { pending: 0, in_progress: 0, completed: 0, cancelled: 0, worker_removed: 0 };
        try {
            const Job = require('../models/Job');
            const jobAgg = await Job.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]);
            jobAgg.forEach(({ _id, count }) => {
                if (_id in jobCounts) jobCounts[_id] = count;
            });
        } catch {
            // Job model not yet created (Slice 3) — return zeros
        }

        // Query all counts in parallel
        const [totalUsers, workerCounts] = await Promise.all([
            User.countDocuments(),
            Worker.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const workerStats = { approved: 0, pending: 0, rejected: 0, blocked: 0 };
        workerCounts.forEach(({ _id, count }) => {
            if (_id in workerStats) workerStats[_id] = count;
        });

        const stats = {
            total_users: totalUsers,
            total_workers: workerStats,
            total_jobs: jobCounts,
            cached_at: new Date().toISOString(),
        };

        // Cache for 5 minutes
        await cacheSet(CACHE_KEYS.ADMIN_STATS, stats, CACHE_TTL.ADMIN_STATS);

        res.status(200).json({
            success: true,
            ...stats,
            from_cache: false,
        });
    } catch (error) {
        console.error('[getDashboardStats]', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/notifications
// List recent notifications — cursor paginated — admin only
// (Useful for audit trail of admin actions)
// ─────────────────────────────────────────────────────────────────────
const getRecentNotifications = async (req, res) => {
    try {
        let limit = parseInt(req.query.limit) || 20;
        if (limit < 1) limit = 1;
        if (limit > 50) limit = 50;

        const cursor = req.query.cursor || null;
        const type = req.query.type || null;

        const query = {};
        if (cursor) query._id = { $lt: cursor };
        if (type) query.type = type;

        const notifications = await Notification.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .populate('user_id', 'name phone')
            .populate('worker_id', 'name phone');

        const { items, hasMore, nextCursor } = paginateResult(notifications, limit);

        res.status(200).json({
            success: true,
            data: items,
            pagination: {
                has_more: hasMore,
                next_cursor: nextCursor,
                limit,
            },
        });
    } catch (error) {
        console.error('[getRecentNotifications]', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

module.exports = {
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
};
