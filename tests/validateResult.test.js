import { describe } from "@jest/globals";
import validateResult from "../src/utils/validateResult.js";

describe("validateResult", () => {
    test("accepts a valid result", () => {
        const result = {
            allowed: true,
            limit: 5,
            remaining: 4,
            resetTime: Date.now() + 60000,
        };

        expect(validateResult(result)).toEqual(result);
    });

    test("rejects a non-object result", () => {
        expect(() => validateResult(null)).toThrow(TypeError);
        expect(() => validateResult("result")).toThrow(TypeError);
        expect(() => validateResult(42)).toThrow(TypeError);
    });

    test("rejects invalid allowed value", () => {
        expect(() =>
            validateResult({
                allowed: "true",
                limit: 5,
                remaining: 4,
                resetTime: Date.now(),
            })
        ).toThrow(TypeError);
    });

    test("rejects invalid limit", () => {
        expect(() =>
            validateResult({
                allowed: true,
                limit: 0,
                remaining: 0,
                resetTime: Date.now(),
            })
        ).toThrow(RangeError);

        expect(() =>
            validateResult({
                allowed: true,
                limit: 5.5,
                remaining: 0,
                resetTime: Date.now(),
            })
        ).toThrow(TypeError);
    });

    test("rejects invalid remaining", () => {
        expect(() =>
            validateResult({
                allowed: true,
                limit: 5,
                remaining: -1,
                resetTime: Date.now(),
            })
        ).toThrow(RangeError);

        expect(() =>
            validateResult({
                allowed: true,
                limit: 5,
                remaining: 6,
                resetTime: Date.now(),
            })
        ).toThrow(RangeError);
    });

    test("rejects invalid resetTime", () => {
        expect(() =>
            validateResult({
                allowed: true,
                limit: 5,
                remaining: 4,
                resetTime: Infinity,
            })
        ).toThrow(TypeError);

        expect(() =>
            validateResult({
                allowed: true,
                limit: 5,
                remaining: 4,
                resetTime: "later",
            })
        ).toThrow(TypeError);
    });
});