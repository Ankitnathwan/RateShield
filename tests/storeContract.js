export default function storeContract(createStore) {
    describe("Store contract", () => {
        let store;

        beforeEach(async () => {
            store = createStore();
            await store.clear();
        });

        afterEach(async () => {
            await store.clear();

            if (store.disconnect) {
                await store.disconnect();
            }
        });

        test("stores and retrieves a value", async () => {
            await store.set("user1", 42);

            expect(await store.get("user1")).toBe(42);
        });

        test("returns undefined for a missing key", async () => {
            expect(await store.get("missing")).toBeUndefined();
        });

        test("checks whether a key exists", async () => {
            await store.set("user1", 42);

            expect(await store.has("user1")).toBe(true);
            expect(await store.has("user2")).toBe(false);
        });

        test("deletes a value", async () => {
            await store.set("user1", 42);
            await store.delete("user1");

            expect(await store.has("user1")).toBe(false);
            expect(await store.get("user1")).toBeUndefined();
        });

        test("clears all values", async () => {
            await store.set("user1", 42);
            await store.set("user2", 100);

            await store.clear();

            expect(await store.has("user1")).toBe(false);
            expect(await store.has("user2")).toBe(false);
        });

        test("increments a value when under the limit", async () => {
            const first = await store.incrementIfAllowed(
                "user1",
                3,
                60_000
            );

            const second = await store.incrementIfAllowed(
                "user1",
                3,
                60_000
            );

            const third = await store.incrementIfAllowed(
                "user1",
                3,
                60_000
            );

            const fourth = await store.incrementIfAllowed(
                "user1",
                3,
                60_000
            );

            expect(first.allowed).toBe(true);
            expect(first.count).toBe(1);

            expect(second.allowed).toBe(true);
            expect(second.count).toBe(2);

            expect(third.allowed).toBe(true);
            expect(third.count).toBe(3);

            expect(fourth.allowed).toBe(false);
            expect(fourth.count).toBe(3);
        });

    });
}