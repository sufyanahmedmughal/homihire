const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;

/**
 * ─────────────────────────────────────────────────────────────────────
 * Redis Cache Utility — v3 spec Section 2.5 (Stats cached 5 minutes)
 *
 * If REDIS_URL is not configured, cache silently degrades:
 *   - get() returns null (cache miss → DB hit every time)
 *   - set() is a no-op
 *   - del() is a no-op
 *
 * This ensures the app works in dev without Redis installed.
 * ─────────────────────────────────────────────────────────────────────
 */
const connectRedis = () => {
    if (!process.env.REDIS_URL) {
        console.warn('⚠️  REDIS_URL not set — caching disabled (stats will be fetched live)');
        return null;
    }

    try {
        redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
            lazyConnect: true,
        });

        redisClient.on('connect', () => {
            isConnected = true;
            console.log('✅ Redis connected');
        });

        redisClient.on('error', (err) => {
            isConnected = false;
            console.warn('⚠️  Redis error (cache disabled):', err.message);
        });

        redisClient.on('close', () => {
            isConnected = false;
        });

        redisClient.connect().catch(() => {
            // Silent — will degrade gracefully
        });

        return redisClient;
    } catch (err) {
        console.warn('⚠️  Redis init failed (cache disabled):', err.message);
        return null;
    }
};

/**
 * Get a cached value by key.
 * @param {string} key
 * @returns {any|null} parsed JSON value, or null on miss/error
 */
const cacheGet = async (key) => {
    if (!redisClient || !isConnected) return null;
    try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

/**
 * Set a cache value with TTL.
 * @param {string} key
 * @param {any}    value  - will be JSON.stringify'd
 * @param {number} ttlSeconds - cache lifetime in seconds
 */
const cacheSet = async (key, value, ttlSeconds) => {
    if (!redisClient || !isConnected) return;
    try {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
        // Silent
    }
};

/**
 * Delete a cache key.
 * @param {string} key
 */
const cacheDel = async (key) => {
    if (!redisClient || !isConnected) return;
    try {
        await redisClient.del(key);
    } catch {
        // Silent
    }
};

// Cache key constants — used across controllers for consistency
const CACHE_KEYS = {
    ADMIN_STATS: 'admin:stats',
};

// TTL constants (seconds)
const CACHE_TTL = {
    ADMIN_STATS: 5 * 60, // 5 minutes — v3 spec Section 2.5
};

module.exports = {
    connectRedis,
    cacheGet,
    cacheSet,
    cacheDel,
    CACHE_KEYS,
    CACHE_TTL,
};
