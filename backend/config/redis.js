const { createClient } = require('redis');

let client = null;
let isCacheAvailable = false;


const shouldConnect = process.env.REDIS_URL || process.env.USE_REDIS === 'true';

if (shouldConnect) {
    try {
        client = createClient({
            url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 3) {
                        console.warn("Redis reconnection attempts exceeded. Disabling caching.");
                        isCacheAvailable = false;
                        return new Error("Retry limit exceeded");
                    }
                    return Math.min(retries * 100, 1000);
                }
            }
        });

        client.on('error', (err) => {
            console.warn("Redis connection error:", err.message);
            isCacheAvailable = false;
        });

        client.on('connect', () => {
            console.log("Connecting to Redis...");
        });

        client.on('ready', () => {
            console.log("Redis client is ready.");
            isCacheAvailable = true;
        });

        client.connect().catch((err) => {
            console.warn("Redis client failed to connect on startup. Caching disabled.", err.message);
            isCacheAvailable = false;
        });

    } catch (err) {
        console.error("Failed to initialize Redis client:", err.message);
        client = null;
        isCacheAvailable = false;
    }
} else {
    console.log("Redis environment variables not configured. Running without Redis caching.");
}

const cache = {
    isAvailable: () => isCacheAvailable && client && client.isOpen,

    get: async (key) => {
        if (!cache.isAvailable()) return null;
        try {
            return await client.get(key);
        } catch (err) {
            console.warn(`Redis GET failed for key "${key}":`, err.message);
            return null;
        }
    },

    set: async (key, value, options = {}) => {
        if (!cache.isAvailable()) return false;
        try {
            await client.set(key, value, options);
            return true;
        } catch (err) {
            console.warn(`Redis SET failed for key "${key}":`, err.message);
            return false;
        }
    },

    del: async (key) => {
        if (!cache.isAvailable()) return false;
        try {
            await client.del(key);
            return true;
        } catch (err) {
            console.warn(`Redis DEL failed for key "${key}":`, err.message);
            return false;
        }
    },

    // Delete keys matching pattern (useful to clear all cache keys for a company/user)
    delWildcard: async (pattern) => {
        if (!cache.isAvailable()) return false;
        try {
            const keys = await client.keys(pattern);
            if (keys && keys.length > 0) {
                await client.del(keys);
            }
            return true;
        } catch (err) {
            console.warn(`Redis DEL wildcard failed for pattern "${pattern}":`, err.message);
            return false;
        }
    }
};

module.exports = cache;
