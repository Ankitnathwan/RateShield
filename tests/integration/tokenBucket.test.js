import express from "express";
import request from "supertest";

import rateLimiter from "../../src/middleware/rateLimiter.js";
import MemoryStore from "../../src/stores/MemoryStore.js";

describe("Token Bucket integration", () => {
    test("limits requests through Express", async () => {
        const app = express();

        app.use(
            rateLimiter({
                algorithm: "token-bucket",
                capacity: 2,
                refillRate: 1,
                store: new MemoryStore(),
            })
        );

        app.get("/test", (req, res) => {
            res.json({ success: true });
        });

        const first = await request(app).get("/test");
        const second = await request(app).get("/test");
        const third = await request(app).get("/test");

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
        expect(third.status).toBe(429);

        expect(third.headers["x-ratelimit-limit"]).toBe("2");
        expect(third.headers["x-ratelimit-remaining"]).toBe("0");
    });
});