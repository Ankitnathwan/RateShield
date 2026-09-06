function ensureBoolean(name, value) {
    if (typeof value !== "boolean") {
        throw new TypeError(`${name} must be a boolean`);
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

function ensureNonNegativeInteger(name, value) {
    if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new TypeError(`${name} must be an integer`);
    }

    if (value < 0) {
        throw new RangeError(`${name} must be greater than or equal to 0`);
    }

    return value;
}

function ensureTimestamp(name, value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`${name} must be a valid timestamp`);
    }

    return value;
}

export default function ValidateResult(result) {
    if (!result || typeof result !== "object") {
        throw new TypeError("Algorithm result must be an object");
    }

    const {
        allowed,
        limit,
        remaining,
        resetTime,
    } = result;

    ensureBoolean("allowed", allowed);
    ensurePositiveInteger("limit", limit);
    ensureNonNegativeInteger("remaining", remaining);
    ensureTimestamp("resetTime", resetTime);

    if (remaining > limit) {
        throw new RangeError("remaining cannot be greater than limit");
    }

    return result;
}