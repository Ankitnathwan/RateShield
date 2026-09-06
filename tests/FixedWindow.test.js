import FixedWindow from "../src/algorithms/FixedWindow.js";
import MemoryStore from "../src/stores/MemoryStore.js";
import { describe, test, expect, jest } from "@jest/globals";

describe("FixedWindow", () => {
    let store;
    let limiter;

    beforeEach(() => {
        store = new MemoryStore();

        limiter = new FixedWindow({
            limit: 5,
            windowMs: 60000,
            store,
        });

        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("allows the first request", async () => {

        const result = await limiter.consume("user1");

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(5);
        expect(result.remaining).toBe(4);

        const state = await store.get("user1");

        expect(state.count).toBe(1);
    });

    test("allows requests upto limit", async () => {

        for (let i = 0; i < 4; i++) {
            await limiter.consume("user1");
        }
        const result = await limiter.consume("user1");

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(0);
        expect((await store.get("user1")).count).toBe(5);

    });

    test("blocks requests over the limit", async () => {

        for (let i = 0; i < 5; i++) {
            await limiter.consume("user1");
        }

        const result = await limiter.consume("user1");
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect((await store.get("user1")).count).toBe(5);

    });

    test("resets after the window expires", async () => {

        for (let i = 0; i < 5; i++) {
            await limiter.consume("user1");
        }

        jest.advanceTimersByTime(60001);

        const result = await limiter.consume("user1");
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
        expect((await store.get("user1")).count).toBe(1);
        expect((await store.get("user1")).windowStart).toBe(Date.now());
    });
});