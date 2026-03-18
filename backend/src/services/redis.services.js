import 'dotenv/config';
import { createClient } from "redis";

const redisClient = createClient({
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

redisClient.on('connect', () => {
    console.log('Redis connected');
});


redisClient.connect().catch((err) => {
    console.log('Redis connection failed:', err);
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});


export { redisClient };
