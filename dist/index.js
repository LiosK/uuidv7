"use strict";
/**
 * uuidv7: An experimental implementation of the proposed UUID Version 7
 *
 * @license Apache-2.0
 * @copyright 2021-2022 LiosK
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidv7 = void 0;
const crypto_1 = require("crypto");
/**
 * Generates a UUIDv7 hexadecimal string.
 *
 * @returns 8-4-4-4-12 hexadecimal string representation
 * ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
 */
const uuidv7 = () => {
    const [timestamp, counter] = getTimestampAndCounter();
    return (hex(Math.trunc(timestamp / 65536), 8) +
        "-" +
        hex(timestamp % 65536, 4) +
        "-" +
        hex(0x7000 | (counter >>> 14), 4) +
        "-" +
        hex(0x8000 | (counter & 0x3fff), 4) +
        "-" +
        hex(rand(48), 12));
};
exports.uuidv7 = uuidv7;
/** Formats a safe unsigned integer as `k`-digit hexadecimal string. */
const hex = (safeUint, k) => {
    return ("0000000000000" + safeUint.toString(16)).slice(-k);
};
/** Returns a `k`-bit unsigned random integer. */
const rand = (() => {
    // detect CSPRNG
    if (typeof window !== "undefined" && window.crypto) {
        // Web Crypto API on browsers
        return (k) => {
            const [hi, lo] = window.crypto.getRandomValues(new Uint32Array(2));
            return k > 32 ? (hi % Math.pow(2, (k - 32))) * Math.pow(2, 32) + lo : lo % Math.pow(2, k);
        };
    }
    else if (crypto_1.randomFillSync) {
        // Node.js Crypto
        return (k) => {
            const [hi, lo] = (0, crypto_1.randomFillSync)(new Uint32Array(2));
            return k > 32 ? (hi % Math.pow(2, (k - 32))) * Math.pow(2, 32) + lo : lo % Math.pow(2, k);
        };
    }
    else {
        return (k) => k > 30
            ? Math.floor(Math.random() * (1 << (k - 30))) * (1 << 30) +
                Math.floor(Math.random() * (1 << 30))
            : Math.floor(Math.random() * (1 << k));
    }
})();
/** Millisecond timestamp at last generation. */
let timestamp = 0;
/** Counter value at last generation. */
let counter = 0;
/**
 * Returns the current unix time in milliseconds and the counter value.
 *
 * @return [timestamp, counter]
 */
const getTimestampAndCounter = () => {
    let now = Date.now();
    if (timestamp < now) {
        timestamp = now;
        counter = rand(26);
    }
    else {
        counter++;
        if (counter > 67108863) {
            // wait a moment until clock moves; reset state and continue otherwise
            for (let i = 0; timestamp >= now && i < 1000000; i++) {
                now = Date.now();
            }
            timestamp = now;
            counter = rand(26);
        }
    }
    return [timestamp, counter];
};
