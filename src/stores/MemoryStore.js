export default class MemoryStore {
    constructor() {
        this.store = new Map();
    }

    async get(key) {
        return this.store.get(key);
    }

    async set(key, value) {
        this.store.set(key, value);
    }

    async delete(key) {
        return this.store.delete(key);
    }

    async has(key) {
        return this.store.has(key);
    }

    async clear() {
        this.store.clear();
    }

    async incrementIfAllowed(key, limit, windowMs) {
        const now = Date.now();
        const state = this.store.get(key);

        if (!state || now - state.windowStart >= windowMs) {
            const newState = {
                count: 1,
                windowStart: now,
            };

            this.store.set(key, newState);

            return {
                allowed: true,
                ...newState,
            };
        }

        if (state.count >= limit) {
            return {
                allowed: false,
                ...state,
            };
        }

        const newState = {
            count: state.count + 1,
            windowStart: state.windowStart,
        };

        this.store.set(key, newState);

        return {
            allowed: true,
            ...newState,
        };
    }
}