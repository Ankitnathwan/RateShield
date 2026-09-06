import FixedWindow from "../src/algorithms/FixedWindow.js";
import RedisStore from "../src/stores/RedisStore.js";

describe("FixedWindow concurrency", () => {
    let store;
    let limiter;

    beforeEach(async () => {
        store = new RedisStore({
            url: "redis://localhost:6379",
        });

        await store.connect();
        await store.clear();

        limiter = new FixedWindow({
            limit: 1,
            windowMs: 60_000,
            store,
        });
    });

    afterEach(async () => {
        await store.clear();
        await store.disconnect();
    });

    test("handles concurrent requests correctly", async () => {
        const results = await Promise.all([
            limiter.consume("user1"),
            limiter.consume("user1"),
        ]);

        const allowedCount = results.filter(
            (result) => result.allowed
        ).length;

        expect(allowedCount).toBe(1);
    });
});