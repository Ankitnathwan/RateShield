import { beforeEach, describe, jest } from "@jest/globals";
import SlidingWindow from "../src/algorithms/slidingWindow";
import MemoryStore from "../src/stores/MemoryStore";

describe("SlidingWindow", () => {
    let store;
    let limiter;

    beforeEach(() => {
        store = new MemoryStore();

        limiter = new SlidingWindow({
            limit: 5,
            windowMs: 60_000,
            store,
        });
    });

    test("allows the first request", async () => {
        const result = await limiter.consume("user1");

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(5);
        expect(result.remaining).toBe(4);

        expect((await store.get("user1")).length).toBe(1);
    });

    test("allows requests up to the limit", async () => {
        for (let i = 0; i < 5; i++) {
            await limiter.consume("user1");
        }

        const result = await limiter.consume("user1");

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect((await store.get("user1")).length).toBe(5);
    });

    test("tracks clients independently", async () => {
        for (let i = 0; i < 5; i++) {
            await limiter.consume("user1");
        }

        const result = await limiter.consume("user2");

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });

    test("removes timestamps outside the sliding window", async () => {
        jest.useFakeTimers();

        try {
            jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));

            for (let i = 0; i < 5; i++) {
                await limiter.consume("user1");
            }

            jest.advanceTimersByTime(60_001);

            const result = await limiter.consume("user1");

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4);
            expect((await store.get("user1")).length).toBe(1);
        } finally {
            jest.useRealTimers();
        }
    });

    test("does not count a timestamp exactly at the window boundary", async () => {
        jest.useFakeTimers();

        try {
            jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));

            await limiter.consume("user1");

            jest.advanceTimersByTime(60_000);

            const result = await limiter.consume("user1");

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4);
            expect((await store.get("user1")).length).toBe(1);
        } finally {
            jest.useRealTimers();
        }
    });
})