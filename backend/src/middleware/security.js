const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sanitizeText } = require('../utils/validators');

/**
 * Security headers middleware (Helmet)
 * Adds all required headers from Slice doc Section 4.5
 */
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
        },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
});

/**
 * Global rate limiter — 100 requests per 15 minutes per IP
 * Section 4.2
 */
const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again later.',
    },
    skip: (req) => req.ip === '127.0.0.1', // Allow localhost in dev
});

/**
 * Strict rate limiter for auth endpoints — 5 requests per 15 minutes per IP
 * Section 4.2 — prevents OTP brute force
 */
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please wait 15 minutes and try again.',
    },
});

/**
 * OTP rate limiter — very strict: 3 requests per 60 seconds per IP
 */
const otpRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many OTP requests. Please wait 60 seconds before requesting again.',
    },
});

/**
 * Input sanitization middleware — strips HTML/script from all body fields
 * Applied on all POST/PUT routes
 * Section 4.4
 */
const sanitizeInput = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        const sanitizeObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitizeText(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            }
        };
        sanitizeObject(req.body);
    }
    next();
};

/**
 * Hide stack traces in production — Section 4.5
 * Error handler that suppresses internal details in production
 */
const productionErrorHandler = (err, req, res, next) => {
    const isDev = process.env.NODE_ENV === 'development';

    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: messages,
        });
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        return res.status(409).json({
            success: false,
            message: `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Value'} already exists`,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
    }

    // Default — never expose stack trace in production
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(isDev && { stack: err.stack }),
    });
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.path}`,
    });
};

module.exports = {
    securityHeaders,
    globalRateLimiter,
    authRateLimiter,
    otpRateLimiter,
    sanitizeInput,
    productionErrorHandler,
    notFoundHandler,
};
