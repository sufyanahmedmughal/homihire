const winston = require('winston');
const { MongoDB } = require('winston-mongodb');

const isDev = process.env.NODE_ENV !== 'production';

const logger = winston.createLogger({
    level: isDev ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        // Console — always on, debug level in dev
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            level: isDev ? 'debug' : 'info',
        }),

        // MongoDB — error_logs collection
        new MongoDB({
            db: process.env.MONGO_URI,
            collection: 'error_logs',
            level: 'error',
            tryReconnect: true,
            options: { useUnifiedTopology: true },
        }),

        // MongoDB — security_logs collection (warn and above)
        new MongoDB({
            db: process.env.MONGO_URI,
            collection: 'security_logs',
            level: 'warn',
            tryReconnect: true,
            options: { useUnifiedTopology: true },
        }),
    ],
});

/**
 * Log an authentication event to auth_logs collection
 * @param {object} data - { user_id, phone, action, ip, status }
 * action: 'register' | 'login' | 'otp_verify' | 'token_refresh' | 'login_fail'
 */
const logAuthEvent = ({ user_id = null, phone = null, action, ip = null, status, role = null, details = null }) => {
    logger.info('auth_event', {
        collection: 'auth_logs',
        user_id,
        phone,
        role,
        action,
        ip,
        status,
        details,
        timestamp: new Date(),
    });
};

/**
 * Log a security event (rate limits, invalid tokens, injection attempts)
 * @param {object} data - { type, ip, user_id, details }
 */
const logSecurityEvent = ({ type, ip = null, user_id = null, details = null }) => {
    logger.warn('security_event', {
        collection: 'security_logs',
        type,
        ip,
        user_id,
        details,
        timestamp: new Date(),
    });
};

module.exports = { logger, logAuthEvent, logSecurityEvent };
