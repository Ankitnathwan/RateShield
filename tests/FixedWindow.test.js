import FixedWindow from "../src/algorithms/FixedWindow.js";
import MemoryStore from "../src/stores/MemoryStore.js";
import { describe, test, expect } from "@jest/globals";

describe("FixedWindow", () => {
    test("allows the first request", () => {
        const store = new MemoryStore();

        const limiter = new FixedWindow({
            limit: 5,
            windowMs: 60000,
            store,
        });

        const result = limiter.consume("user1");

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(5);
        expect(result.remaining).toBe(4);

        const state = store.get("user1");

        expect(state.count).toBe(1);
    });
});