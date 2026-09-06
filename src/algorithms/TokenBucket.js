export default class TokenBucket {
    constructor({ capacity, refillRate, store }) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.store = store;
    }

    async consume(clientId) {
        const now = Date.now();
        let state = await this.store.get(clientId);

        if (!state) {
            state = {
                tokens: this.capacity,
                lastRefill: now,
            };
        }

        const elapsedSeconds =
            (now - state.lastRefill) / 1000;

        const tokensToAdd =
            elapsedSeconds * this.refillRate;

        const tokens = Math.min(
            this.capacity,
            state.tokens + tokensToAdd
        );

        if (tokens < 1) {
            await this.store.set(clientId, {
                tokens,
                lastRefill: now,
            });

            return {
                allowed: false,
                limit: this.capacity,
                remaining: Math.floor(tokens),
                resetTime:
                    now + ((1 - tokens) / this.refillRate) * 1000,
            };
        }

        const remainingTokens = tokens - 1;

        await this.store.set(clientId, {
            tokens: remainingTokens,
            lastRefill: now,
        });

        return {
            allowed: true,
            limit: this.capacity,
            remaining: Math.floor(remainingTokens),
            resetTime: now,
        };
    }
}