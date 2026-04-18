import 'dotenv/config';
import { createClient } from "redis";

// In-memory fallback for token blacklist when Redis is unavailable
const inMemoryBlacklist = new Set();

let redisClient = null;
let redisAvailable = false;

// Only try to connect to Redis if credentials are provided
if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
    redisClient = createClient({
        password: process.env.REDIS_PASS || undefined,
        socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT)
        }
    });

    redisClient.on('connect', () => {
        console.log('✅ Redis connected');
        redisAvailable = true;
    });

    redisClient.on('error', (err) => {
        console.error('❌ Redis Client Error:', err.message);
        redisAvailable = false;
    });

    redisClient.connect().catch((err) => {
        console.error('❌ Redis connection failed:', err.message);
        console.warn('⚠️  Using in-memory token blacklist (not suitable for production with multiple servers)');
        redisAvailable = false;
    });
} else {
    console.warn('⚠️  Redis not configured. Using in-memory token blacklist.');
    console.warn('   Set REDIS_HOST and REDIS_PORT in .env for production use.');
}

// Wrapper functions that fallback to in-memory storage
export const redisService = {
    async get(key) {
        if (redisAvailable && redisClient) {
            try {
                return await redisClient.get(key);
            } catch (err) {
                console.error('Redis GET error:', err.message);
                return inMemoryBlacklist.has(key) ? 'logout' : null;
            }
        }
        return inMemoryBlacklist.has(key) ? 'logout' : null;
    },

    async set(key, value, options) {
        if (redisAvailable && redisClient) {
            try {
                return await redisClient.set(key, value, options);
            } catch (err) {
                console.error('Redis SET error:', err.message);
                inMemoryBlacklist.add(key);
                // Auto-cleanup after expiry time
                if (options?.EX) {
                    setTimeout(() => inMemoryBlacklist.delete(key), options.EX * 1000);
                }
                return 'OK';
            }
        }
        inMemoryBlacklist.add(key);
        // Auto-cleanup after expiry time
        if (options?.EX) {
            setTimeout(() => inMemoryBlacklist.delete(key), options.EX * 1000);
        }
        return 'OK';
    },

    async del(key) {
        if (redisAvailable && redisClient) {
            try {
                return await redisClient.del(key);
            } catch (err) {
                console.error('Redis DEL error:', err.message);
                inMemoryBlacklist.delete(key);
                return 1;
            }
        }
        inMemoryBlacklist.delete(key);
        return 1;
    }
};

// Export for backward compatibility
export { redisClient };
