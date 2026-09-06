import { json } from "express";
import { createClient } from "redis";

export default class RedisStore {
    constructor({ url } = {}) {
        this.client = createClient({
            url: url || process.env.REDIS_URL,
        });

        this.client.on("error", (error) => {
            console.error("Redis Client Error:", error);
        });
    }

    async connect() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }

    async get(key) {
        await this.connect();

        const value = await this.client.get(key);

        if (value == null) {
            return undefined;
        }

        return JSON.parse(value);
    }

    async set(key, value) {
        await this.connect();

        await this.client.set(key, JSON.stringify(value));
    }

    async delete(key) {
        await this.connect();

        const result = this.client.del(key);

        return result > 0;
    }

    async has(key) {
        await this.connect();

        const result = await this.client.exists(key);

        return result === 1;
    }

    async clear() {
        await this.connect();

        await this.client.flushDb();
    }

    async disconnect() {
        if (this.client.isOpen) {
            await this.client.quit();
        }
    }

    async incrementIfAllowed(key, limit, windowMs) {
        await this.connect();

        const result = await this.client.eval(
            `
        local count = redis.call("GET", KEYS[1])

        if not count then
            redis.call("SET", KEYS[1], 1, "PX", ARGV[2])
            return {1, 1, ARGV[2]}
        end

        count = tonumber(count)

        if count >= tonumber(ARGV[1]) then
            local ttl = redis.call("PTTL", KEYS[1])
            return {0, count, ttl}
        end

        count = redis.call("INCR", KEYS[1])

        local ttl = redis.call("PTTL", KEYS[1])

        return {1, count, ttl}
        `,
            {
                keys: [key],
                arguments: [
                    String(limit),
                    String(windowMs),
                ],
            }
        );

        const allowed = result[0] === 1;
        const count = Number(result[1]);
        const ttl = Number(result[2]);

        return {
            allowed,
            count,
            windowStart: Date.now() - ttl,
        };
    }
}