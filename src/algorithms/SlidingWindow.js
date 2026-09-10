export default class SlidingWindow {
    constructor({ limit, windowMs, store }) {
        this.limit = limit;
        this.windowMs = windowMs;
        this.store = store;
    }

    async consume(clientId) {
        const now = Date.now();
        const state = (await this.store.get(clientId)) || [];
        const windowStart = now - this.windowMs;

        let firstValidIndex = 0;

        while (
            firstValidIndex < state.length &&
            state[firstValidIndex] <= windowStart
        ) {
            firstValidIndex++;
        }

        const validTimestamps = state.slice(firstValidIndex);

        if (validTimestamps.length >= this.limit) {
            await this.store.set(clientId, validTimestamps);

            return {
                allowed: false,
                limit: this.limit,
                remaining: 0,
                resetTime:
                    validTimestamps[0] + this.windowMs,
            };
        }

        validTimestamps.push(now);

        await this.store.set(clientId, validTimestamps);

        return {
            allowed: true,
            limit: this.limit,
            remaining: this.limit - validTimestamps.length,
            resetTime:
                validTimestamps[0] + this.windowMs,
        };
    }
}