import validateOptions from "../utils/validateOptions.js";
import validateResult from "../utils/validateResult.js";
import algorithms from "../algorithms/index.js";

export default function rateLimiter(options) {
    const config = validateOptions(options);

    const Algorithm = algorithms[config.algorithm];

    const limiter = new Algorithm({
        ...config,
    });

    return async function (req, res, next) {
        const clientId = config.keyGenerator(req);

        const result = await limiter.consume(clientId);

        validateResult(result);

        res.set({
            "X-RateLimit-Limit": result.limit,
            "X-RateLimit-Remaining": result.remaining,
            "X-RateLimit-Reset": result.resetTime,
        });

        if (!result.allowed) {
            return res.status(429).json({
                error: "Too many requests",
            });
        }

        next();
    };
}