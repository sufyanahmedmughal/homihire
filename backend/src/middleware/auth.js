const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { Worker } = require('../models/Worker');
const Admin = require('../models/Admin');
const { logSecurityEvent } = require('../config/logger');

/**
 * Core JWT authentication middleware — v3 spec Section 4.1
 * Validates the Bearer token, fetches live DB record on every request.
 * This ensures blocked/rejected accounts cannot use stale tokens.
 *
 * Sets req.user = { id, role, record }
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const ip = req.ip || req.socket?.remoteAddress;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token is required',
            });
        }

        const token = authHeader.split(' ')[1];
        let decoded;

        try {
            decoded = verifyToken(token);
        } catch (err) {
            const message =
                err.name === 'TokenExpiredError'
                    ? 'Session expired. Please log in again.'
                    : 'Invalid token. Please log in again.';

            logSecurityEvent({
                type: 'invalid_token',
                ip,
                details: err.name,
            });

            return res.status(401).json({ success: false, message });
        }

        const { id, role } = decoded;
        let record;

        if (role === 'user') {
            record = await User.findById(id);
            if (!record) {
                return res.status(401).json({ success: false, message: 'User account not found' });
            }
            if (record.status === 'blocked') {
                logSecurityEvent({ type: 'blocked_access', ip, user_id: id });
                return res.status(403).json({
                    success: false,
                    message: 'Account blocked. Please contact support.',
                });
            }

        } else if (role === 'worker') {
            record = await Worker.findById(id);
            if (!record) {
                return res.status(401).json({ success: false, message: 'Worker account not found' });
            }
            if (record.status === 'blocked') {
                logSecurityEvent({ type: 'blocked_access', ip, user_id: id });
                return res.status(403).json({
                    success: false,
                    message: 'Account blocked. Please contact support.',
                });
            }
            if (record.status === 'pending') {
                return res.status(403).json({
                    success: false,
                    message: 'Account pending admin approval.',
                });
            }

        } else if (role === 'admin') {
            record = await Admin.findById(id);
            if (!record || !record.is_active) {
                return res.status(401).json({ success: false, message: 'Admin not found or inactive' });
            }

        } else {
            logSecurityEvent({ type: 'invalid_token', ip, details: `unknown role: ${role}` });
            return res.status(401).json({ success: false, message: 'Invalid token role' });
        }

        req.user = { id, role, record };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(500).json({ success: false, message: 'Authentication error' });
    }
};

/**
 * Restrict access to specific roles
 * Usage: authorizeRoles('admin') or authorizeRoles('admin', 'user')
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            logSecurityEvent({
                type: 'blocked_access',
                ip: req.ip,
                user_id: req.user?.id,
                details: `role ${req.user?.role} attempted to access ${req.path}`,
            });
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource',
            });
        }
        next();
    };
};

/**
 * Require specifically approved workers
 */
const requireApprovedWorker = (req, res, next) => {
    if (req.user.role !== 'worker') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user.record.status !== 'approved') {
        return res.status(403).json({
            success: false,
            message: 'Worker account must be approved before accessing this feature.',
        });
    }
    next();
};

module.exports = { authenticate, authorizeRoles, requireApprovedWorker };
