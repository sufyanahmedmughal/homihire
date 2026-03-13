const jwt = require('jsonwebtoken');

const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generate a JWT token for a user, worker, or admin
 * @param {object} payload - { id, role }
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not configured in environment variables');
    }
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
        issuer: 'homihire-api',
        audience: 'homihire-app',
    });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not configured in environment variables');
    }
    return jwt.verify(token, JWT_SECRET, {
        issuer: 'homihire-api',
        audience: 'homihire-app',
    });
};

/**
 * Decode a JWT without verifying (for inspecting expired tokens)
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = { generateToken, verifyToken, decodeToken };
