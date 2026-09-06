import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import rateLimiter from "../../src/middleware/rateLimiter";

describe("rateLimiter middleware", () => {
    let middleware;
    let req;
    let res;
    let next;

    beforeEach(() => {
        middleware = rateLimiter({
            algorithm: "fixed-window",
            limit: 2,
            windowMs: 60_000,
        });

        req = {
            ip: "user1",
        };

        res = {
            set: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();
    });

    test("allows requests under the limit", async () => {
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    test("blocks requests over the limit", async () => {
        await middleware(req, res, next);
        await middleware(req, res, next);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith({
            error: "Too many requests",
        });
    });

    test("set rate limit headers", async () => {
        await middleware(req, res, next);

        expect(res.set).toHaveBeenCalledWith(
            expect.objectContaining({
                "X-RateLimit-Limit": 2,
                "X-RateLimit-Remaining": 1,
            })
        );
    });

    test("uses the request IP as the client ID", async () => {
        await middleware(req, res, next);

        req.ip = "user2";

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(2);
    });

    test("uses IP as the default client identifier", async () => {
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    test("gives different IPs separate rate limits", async () => {
        await middleware(req, res, next);

        req.ip = "user2";

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(2);
    });

    test("uses a custom key generator", async () => {
        const customMiddleware = rateLimiter({
            limit: 1,
            windowMs: 60_000,
            keyGenerator: (req) => req.headers["x-api-key"],
        });

        req.headers = {
            "x-api-key": "user123",
        };

        await customMiddleware(req, res, next);

        await customMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(429);
    });

    test("different custom keys have separate limits", async () => {
        const customMiddleware = rateLimiter({
            limit: 1,
            windowMs: 60_000,
            keyGenerator: (req) => req.headers["x-api-key"],
        });

        req.headers = {
            "x-api-key": "user123",
        };

        await customMiddleware(req, res, next);

        req.headers["x-api-key"] = "user456";

        await customMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(2);
    });
})