import { beforeEach, describe, expect, jest } from "@jest/globals";
import TokenBucket from "../src/algorithms/TokenBucket";
import MemoryStore from "../src/stores/MemoryStore";

describe("TokenBucket", () => {
    let store;
    let limiter;

    beforeEach(() => {
        store = new MemoryStore();
        limiter = new TokenBucket({
            capacity: 5,
            refillRate: 1,
            store,
        });
    });

    test("allows the initial burst up to capacity", async () => {
        for (let i = 0; i < 5; i++) {
            const result = await limiter.consume("user1");

            expect(result.allowed).toBe(true);
        }

        const state = await store.get("user1");
        expect(state.tokens).toBeGreaterThanOrEqual(0);
        expect(state.tokens).toBeLessThan(1);
    });

    test("blocks when there are no tokens", async () => {
        for (let i = 0; i < 5; i++) {
            await limiter.consume("user1");
        }

        const result = await limiter.consume("user1");

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    test("refills tokens over time", async () => {
        jest.useFakeTimers();

        try {
            jest.setSystemTime(
                new Date("2026-01-01T00:00:00Z")
            );

            for (let i = 0; i < 5; i++) {
                await limiter.consume("user1");
            }

            jest.advanceTimersByTime(2000);

            const result = await limiter.consume("user1");

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(1);

        } finally {
            jest.useRealTimers();
        }
    });

    test("does not exceed bucket capacity", async () => {
        jest.useFakeTimers();

        try {
            jest.setSystemTime(
                new Date("2026-01-01T00:00:00Z")
            );

            await limiter.consume("user1");

            jest.advanceTimersByTime(10000);

            const state = await store.get("user1");

            expect(state.tokens).toBe(4);
        } finally {
            jest.useRealTimers();
        }
    });

    test("different clients have separate buckets", async () => {
        for (let i = 0; i < 5; i++) {
            await limiter.consume("user1");
        }

        const result = await limiter.consume("user2");

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });
})