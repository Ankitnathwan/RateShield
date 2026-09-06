export default class FixedWindow {
    constructor({ limit, windowMs, store }) {
        this.limit = limit;
        this.windowMs = windowMs;
        this.store = store;
    }

    async _resetWindow(clientId, now) {
        const state = {
            count: 1,
            windowStart: now,
        };

        await this.store.set(clientId, state);

        return {
            allowed: true,
            limit: this.limit,
            remaining: this.limit - 1,
            resetTime: now + this.windowMs,
        };
    }

    async consume(clientId) {
        const state = await this.store.incrementIfAllowed(
            clientId,
            this.limit,
            this.windowMs
        );

        const resetTime = state.windowStart + this.windowMs;

        return {
            allowed: state.allowed,
            limit: this.limit,
            remaining: state.allowed
                ? this.limit - state.count
                : 0,
            resetTime,
        };
    }
}