# RateShield

Configurable and extensible rate-limiting middleware for Express.js.

RateShield provides multiple rate-limiting algorithms, pluggable storage backends, customizable client identification, rate-limit response headers, and an async-first architecture designed to support both in-memory and Redis-backed rate limiting.

## Features

* Multiple rate-limiting algorithms

  * Fixed Window
  * Sliding Window
  * Token Bucket
* Pluggable storage backends

  * In-memory storage
  * Redis
* Custom client key generation
* Standard `X-RateLimit-*` response headers
* Atomic rate limiting with Redis
* Async-first storage architecture
* Input and result validation
* Express.js middleware integration
* Comprehensive Jest test suite
* Integration tests using Supertest
* Concurrency testing for rate limiting

## Installation

```bash
npm install @ankitn7/rateshield
```

## Quick Start

```javascript
import express from "express";
import { rateLimiter } from "rateshield";

const app = express();

app.use(
    rateLimiter({
        algorithm: "fixed-window",
        limit: 100,
        windowMs: 60_000,
    })
);

app.get("/", (req, res) => {
    res.json({
        message: "Hello from RateShield",
    });
});

app.listen(3000);
```

By default, RateShield uses the client's IP address as the rate-limit key.

## Algorithms

RateShield currently supports three rate-limiting algorithms.

### Fixed Window

Fixed Window divides time into fixed intervals and limits the number of requests allowed during each interval.

```javascript
rateLimiter({
    algorithm: "fixed-window",
    limit: 100,
    windowMs: 60_000,
});
```

In this example, each client can make up to 100 requests during a 60-second window.

**Characteristics:**

* Simple and efficient
* Low memory overhead
* Easy to understand and implement
* Can allow bursts around window boundaries

### Sliding Window

Sliding Window tracks request timestamps and evaluates requests against a continuously moving time window.

```javascript
rateLimiter({
    algorithm: "sliding-window",
    limit: 100,
    windowMs: 60_000,
});
```

This provides smoother rate limiting than a fixed window because the limit is based on the requests that occurred during the most recent time interval.

**Characteristics:**

* More accurate than Fixed Window
* Reduces boundary bursts
* Stores request timestamps
* Higher memory usage for high request volumes

### Token Bucket

Token Bucket maintains a bucket of tokens that are consumed by requests and continuously refilled over time.

```javascript
rateLimiter({
    algorithm: "token-bucket",
    capacity: 100,
    refillRate: 1,
});
```

`capacity` determines the maximum number of tokens that can be stored.

`refillRate` determines how many tokens are added per second.

For example:

```javascript
rateLimiter({
    algorithm: "token-bucket",
    capacity: 10,
    refillRate: 2,
});
```

This allows bursts of up to 10 requests when the bucket is full, while replenishing tokens at a rate of 2 per second.

**Characteristics:**

* Supports controlled bursts
* Smooth request throttling
* Continuous token replenishment
* Fractional tokens can be maintained internally

## Storage

RateShield separates rate-limiting algorithms from their storage implementation.

The architecture allows different storage backends to be plugged into the algorithms.

### MemoryStore

`MemoryStore` stores rate-limit state in the Node.js process using a JavaScript `Map`.

It is useful for:

* Local development
* Testing
* Single-process applications
* Simple deployments

Example:

```javascript
import { rateLimiter, MemoryStore, } from "rateshield";

rateLimiter({
    algorithm: "fixed-window",
    limit: 100,
    windowMs: 60_000,
    store: new MemoryStore(),
});
```

The default configuration uses an in-memory store.

### RedisStore

`RedisStore` allows rate-limit state to be shared through Redis.

This is useful when an application runs across multiple processes or server instances.

Example:

```javascript
import { rateLimiter, RedisStore, } from "rateshield";

const store = new RedisStore({
    url: "redis://localhost:6379",
});

app.use(
    rateLimiter({
        algorithm: "fixed-window",
        limit: 100,
        windowMs: 60_000,
        store,
    })
);
```

You can also configure Redis through the `REDIS_URL` environment variable:

```env
REDIS_URL=redis://localhost:6379
```

Then:

```javascript
const store = new RedisStore();
```

Redis-backed Fixed Window rate limiting uses an atomic Redis operation to prevent concurrent requests from incorrectly exceeding the configured limit.

## Custom Key Generator

By default, RateShield identifies clients using their IP address:

```javascript
(req) => req.ip
```

You can provide your own key generator.

For example, to rate-limit using an API key:

```javascript
rateLimiter({
    algorithm: "fixed-window",
    limit: 100,
    windowMs: 60_000,

    keyGenerator: (req) => {
        return req.headers["x-api-key"];
    },
});
```

You can also use authenticated user IDs:

```javascript
rateLimiter({
    algorithm: "fixed-window",
    limit: 100,
    windowMs: 60_000,

    keyGenerator: (req) => {
        return req.user.id;
    },
});
```

This allows applications to choose the appropriate rate-limiting strategy for their authentication and API architecture.

## Rate Limit Headers

RateShield adds rate-limit information to responses using the following headers:

```text
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

Example:

```text
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1726000000000
```

When the configured limit is exceeded, RateShield responds with:

```http
429 Too Many Requests
```

and:

```json
{
    "error": "Too many requests"
}
```

## Configuration

### Fixed Window / Sliding Window

```javascript
rateLimiter({
    algorithm: "fixed-window",
    limit: 100,
    windowMs: 60_000,
});
```

| Option         | Type       | Description                            |
| -------------- | ---------- | -------------------------------------- |
| `algorithm`    | `string`   | `"fixed-window"` or `"sliding-window"` |
| `limit`        | `integer`  | Maximum requests allowed               |
| `windowMs`     | `integer`  | Window duration in milliseconds        |
| `store`        | `Store`    | Storage backend                        |
| `keyGenerator` | `function` | Generates the client identifier        |

### Token Bucket

```javascript
rateLimiter({
    algorithm: "token-bucket",
    capacity: 100,
    refillRate: 1,
});
```

| Option         | Type       | Description                     |
| -------------- | ---------- | ------------------------------- |
| `algorithm`    | `string`   | `"token-bucket"`                |
| `capacity`     | `integer`  | Maximum number of tokens        |
| `refillRate`   | `number`   | Tokens added per second         |
| `store`        | `Store`    | Storage backend                 |
| `keyGenerator` | `function` | Generates the client identifier |

## Default Configuration

Calling:

```javascript
rateLimiter();
```

uses the following defaults:

```javascript
{
    algorithm: "fixed-window",
    limit: 100,
    windowMs: 60_000,
    store: new MemoryStore(),
    keyGenerator: (req) => req.ip,
}
```

## Architecture

RateShield separates the middleware, algorithms, and storage layers.

```text
                    Express Request
                           │
                           ▼
                   RateLimiter Middleware
                           │
                           ▼
                    Algorithm Registry
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Fixed Window     Sliding Window    Token Bucket
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                     Store Interface
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
             MemoryStore       RedisStore
```

### Why this architecture?

The algorithms do not need to know how data is stored.

For example:

```text
FixedWindow
     │
     ▼
   Store
     │
 ┌───┴────┐
 ▼        ▼
Memory   Redis
```

This makes the system easier to extend and test.

A new storage backend can implement the required store operations without changing the rate-limiting algorithms.

## Async-First Design

RateShield uses an async-first storage architecture.

Even though `MemoryStore` operates locally in memory, its interface is asynchronous:

```javascript
await store.get(key);
await store.set(key, value);
```

This allows the same algorithm implementation to work with both local and network-based storage.

```text
MemoryStore → async → Map
RedisStore  → async → Redis
```

This avoids coupling the algorithms to a specific storage implementation.

## Validation

RateShield validates configuration options before creating a rate limiter.

Examples of validated values include:

* Supported algorithm names
* Positive request limits
* Positive window durations
* Positive token bucket capacity
* Positive refill rates
* Valid key generator functions

Algorithm results are also validated before being used by the middleware.

Expected algorithm result:

```javascript
{
    allowed: true,
    limit: 100,
    remaining: 99,
    resetTime: 1726000000000,
}
```

This provides a consistent contract between algorithms and the middleware.

## Testing

RateShield uses Jest for automated testing.

The test suite covers:

* Fixed Window behavior
* Sliding Window behavior
* Token Bucket behavior
* MemoryStore
* RedisStore
* Store contract compatibility
* Configuration validation
* Result validation
* Custom key generators
* Middleware behavior
* Express integration
* Concurrency behavior

Run the test suite with:

```bash
npm test -- --runInBand
```

The project also includes integration tests using Supertest to verify RateShield behavior through an actual Express application.

## Benchmarks

RateShield includes a benchmark suite for comparing algorithm performance.

Run:

```bash
node benchmarks/algorithms.js
```

Benchmarking is currently focused on comparing the computational characteristics of the supported algorithms.

Performance results can vary depending on hardware, Node.js version, workload, and configuration.

## Project Structure

```text
RateShield/
├── src/
│   ├── algorithms/
│   │   ├── FixedWindow.js
│   │   ├── SlidingWindow.js
│   │   ├── TokenBucket.js
│   │   └── index.js
│   │
│   ├── middleware/
│   │   └── rateLimiter.js
│   │
│   ├── stores/
│   │   ├── MemoryStore.js
│   │   └── RedisStore.js
│   │
│   ├── utils/
│   │   ├── validateOptions.js
│   │   └── validateResult.js
│   │
│   └── index.js
│
├── demo/
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── middleware/
│   └── integration/
│
├── benchmarks/
│   └── algorithms.js
│
├── package.json
└── README.md
```

## Roadmap

Planned improvements include:

* Additional rate-limiting algorithms
* Further Sliding Window optimization
* Improved Redis key isolation
* More configurable response behavior
* Additional storage adapters
* Better package documentation
* Production deployment examples
* Additional performance benchmarks
* npm package publication

## Contributing

Contributions, suggestions, and improvements are welcome.

If you find a bug or have an idea for a feature, open an issue or submit a pull request.

## License

MIT License

Copyright (c) 2026 Ankit Nathwan

See the `LICENSE` file for the full license text.

## Author

**Ankit Nathwan**

GitHub:
https://github.com/Ankitnathwan/RateShield
