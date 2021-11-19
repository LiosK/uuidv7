"use strict";
/**
 * uuidv7: an experimental implementation of the proposed UUIDv7
 *
 * @license Apache-2.0
 * @copyright 2021 LiosK
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
    const [sec, subsec] = getTimestamp();
    const hexSec = "00000000" + sec.toString(16);
    const matchSec = /([0-9a-f]{8})([0-9a-f])$/.exec(hexSec);
    const hexSubsec = (subsec === 0 ? "0.0" : subsec.toString(16)) + "00000";
    const matchSubsec = /^0\.([0-9a-f]{3})([0-9a-f]{3})/.exec(hexSubsec);
    if (matchSec == null || matchSubsec == null) {
        const message = `${hexSec}.${hexSubsec} !~ xxxxxxxxx.xxxxxx`;
        throw new Error(`assertion error: ${message}`);
    }
    return (matchSec[1] +
        "-" +
        matchSec[2] +
        matchSubsec[1] +
        "-7" +
        matchSubsec[2] +
        "-" +
        hex(0x8000 | rand(14), 4) +
        "-" +
        hex(rand(48), 12));
};
exports.uuidv7 = uuidv7;
/** Formats a safe unsigned integer as `k`-digit hexadecimal string. */
const hex = (safeUint, k) => {
    return ("0000000000000" + safeUint.toString(16)).slice(-k);
};
/** Returns an `k`-bit unsigned random integer. */
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
let lastMsec = 0;
/**
 * Submillisecond timestamp fraction at last generation, represented as a
 * multiple of 1 / 0x1_0000.
 */
let lastSubmsec = 0;
/**
 * Unit by which the submillisecond fraction is incremented when multiple UUIDs
 * are generated within the same millisecond.
 */
const SUBMSEC_INCREMENT = 16 / 65536;
/**
 * Returns the current unix time as a pair of seconds and subsecond fraction.
 *
 * @return [sec, subsec]
 */
const getTimestamp = () => {
    let msecNow = Date.now();
    if (lastMsec < msecNow) {
        lastMsec = msecNow;
        lastSubmsec = rand(16) / 65536;
    }
    else {
        lastSubmsec += SUBMSEC_INCREMENT;
        if (lastSubmsec > 0xffff / 65536) {
            // wait a moment until clock moves; reset state and continue otherwise
            for (let i = 0; lastMsec >= msecNow && i < 1000000; i++) {
                msecNow = Date.now();
            }
            lastMsec = msecNow;
            lastSubmsec = rand(16) / 65536;
        }
    }
    return [
        Math.floor(lastMsec / 1000),
        ((lastMsec % 1000) + lastSubmsec) / 1000,
    ];
};
