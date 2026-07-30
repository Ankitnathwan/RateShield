export default class FixedWindow {
    constructor({ limit, windowMs, store }) {
        this.limit = limit;
        this.windowMs = windowMs;
        this.store = store;
    }

    _resetWindow(clientId, now) {
        const state = {
            count: 1,
            windowStart: now,
        };

        this.store.set(clientId, state);

        return {
            allowed: true,
            limit: this.limit,
            remaining: this.limit - 1,
            resetTime: now + this.windowMs,
        };
    }

    consume(clientId) {
        const now = Date.now();
        const state = this.store.get(clientId);

        //first request
        if (!state) {
            return this._resetWindow(clientId, now);
        }

        //window expired
        if (now - state.windowStart >= this.windowMs) {
            return this._resetWindow(clientId, now);
        }

        //within the current window
        if (state.count < this.limit) {
            const updatedState = {
                ...state,
                count: state.count + 1,
            };

            this.store.set(clientId, updatedState);

            return {
                allowed: true,
                limit: this.limit,
                remaining: this.limit - updatedState.count,
                resetTime: state.windowStart + this.windowMs,
            };
        }

        //limit exceeded
        return {
            allowed: false,
            limit: this.limit,
            remaining: 0,
            resetTime: state.windowStart + this.windowMs,
        };
    }
}