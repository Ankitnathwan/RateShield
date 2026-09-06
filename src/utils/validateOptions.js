import MemoryStore from "../stores/MemoryStore.js";

const SUPPORTED_ALGORITHMS = [
    "fixed-window",
    "sliding-window",
    "token-bucket",
];

function ensureString(name, value) {
    if (typeof value !== "string") {
        throw new TypeError(`${name} must be a string`);
    }

    return value;
}

function ensurePositiveInteger(name, value) {
    if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new TypeError(`${name} must be an integer`);
    }

    if (value <= 0) {
        throw new RangeError(`${name} must be greater than 0`);
    }

    return value;
}

function ensurePositiveNumber(name, value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`${name} must be a number`);
    }

    if (value <= 0) {
        throw new RangeError(`${name} must be greater than 0`);
    }

    return value;
}

function ensureFunction(name, value) {
    if (typeof value !== "function") {
        throw new TypeError(`${name} must be a function`);
    }

    return value;
}

export default function validateOptions(options = {}) {
    const {
        algorithm = "fixed-window",
        store = new MemoryStore(),
        keyGenerator = (req) => req.ip,
    } = options;

    const validatedAlgorithm = ensureString(
        "algorithm",
        algorithm
    );

    if (!SUPPORTED_ALGORITHMS.includes(validatedAlgorithm)) {
        throw new RangeError(
            `Unsupported algorithm: ${validatedAlgorithm}`
        );
    }

    const config = {
        algorithm: validatedAlgorithm,
        store,
        keyGenerator: ensureFunction(
            "keyGenerator",
            keyGenerator
        ),
    };

    if (
        validatedAlgorithm === "fixed-window" ||
        validatedAlgorithm === "sliding-window"
    ) {
        config.limit = ensurePositiveInteger(
            "limit",
            options.limit ?? 100
        );

        config.windowMs = ensurePositiveInteger(
            "windowMs",
            options.windowMs ?? 60_000
        );
    }

    if (validatedAlgorithm === "token-bucket") {
        config.capacity = ensurePositiveInteger(
            "capacity",
            options.capacity ?? 100
        );

        config.refillRate = ensurePositiveNumber(
            "refillRate",
            options.refillRate ?? 1
        );
    }

    return config;
}