import FixedWindow from "../src/algorithms/FixedWindow.js";
import SlidingWindow from "../src/algorithms/SlidingWindow.js";
import TokenBucket from "../src/algorithms/TokenBucket.js";
import MemoryStore from "../src/stores/MemoryStore.js";

const REQUESTS = 100_000;

async function benchmark(name, createLimiter) {
    const limiter = createLimiter();

    const start = performance.now();

    for (let i = 0; i < REQUESTS; i++) {
        await limiter.consume("benchmark-user");
    }

    const end = performance.now();

    const duration = end - start;
    const requestsPerSecond =
        (REQUESTS / duration) * 1000;

    console.log(`${name}`);
    console.log(`  Time: ${duration.toFixed(2)} ms`);
    console.log(
        `  Requests/sec: ${requestsPerSecond.toFixed(0)}`
    );
    console.log();
}

await benchmark("Fixed Window", () =>
    new FixedWindow({
        limit: REQUESTS + 1,
        windowMs: 60_000,
        store: new MemoryStore(),
    })
);

await benchmark("Sliding Window", () =>
    new SlidingWindow({
        limit: REQUESTS + 1,
        windowMs: 60_000,
        store: new MemoryStore(),
    })
);

await benchmark("Token Bucket", () =>
    new TokenBucket({
        capacity: REQUESTS + 1,
        refillRate: 1,
        store: new MemoryStore(),
    })
);