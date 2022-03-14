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
    return generateV7().toString();
};
exports.uuidv7 = uuidv7;
const generateV7 = () => {
    const [timestamp, counter] = getTimestampAndCounter();
    return UUID.fromWords(Math.trunc(timestamp / 65536), (timestamp % 65536) * 65536 + (0x7000 | (counter >>> 14)), (0x8000 | (counter & 0x3fff)) * 65536 + rand(16), rand(32));
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
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
class UUID {
    constructor(words) {
        this.words = words;
        if (words.length !== 4) {
            throw new TypeError("words is not 128-bit length");
        }
    }
    static fromWords(w0, w1, w2, w3) {
        return new UUID(Uint32Array.of(w0, w1, w2, w3));
    }
    toString() {
        const ds = this.convertRadix(this.words, new Uint8Array(32), Math.pow(2, 32), 16);
        let text = "";
        for (let i = 0; i < ds.length; i++) {
            text += DIGITS.charAt(ds[i]);
            if (i === 7 || i === 11 || i === 15 || i === 19) {
                text += "-";
            }
        }
        return text;
    }
    toBase36String() {
        const ds = this.convertRadix(this.words, new Uint8Array(25), Math.pow(2, 32), 36);
        let text = "";
        for (let i = 0; i < ds.length; i++) {
            text += DIGITS.charAt(ds[i]);
        }
        return text;
    }
    /** Converts a digit value array in `srcRadix` to that in `dstRadix`. */
    convertRadix(src, dst, srcRadix, dstRadix) {
        let dstUsed = dst.length - 1;
        for (let carry of src) {
            // Iterate over dst from right while carry != 0 or up to place already used
            let i = dst.length - 1;
            for (; carry > 0 || i >= dstUsed; i--) {
                if (i < 0) {
                    throw new TypeError("dst.length is too short");
                }
                carry += dst[i] * srcRadix;
                dst[i] = carry % dstRadix;
                carry = Math.trunc(carry / dstRadix);
            }
            dstUsed = i + 1;
        }
        return dst;
    }
}
