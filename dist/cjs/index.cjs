"use strict";
/**
 * uuidv7: An experimental implementation of the proposed UUID Version 7
 *
 * @license Apache-2.0
 * @copyright 2021-2022 LiosK
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidv4obj = exports.uuidv4 = exports.uuidv7obj = exports.uuidv7 = exports.UUID = void 0;
const DIGITS = "0123456789abcdef";
/** Represents a UUID as a 16-byte byte array. */
class UUID {
    /** @param bytes - 16-byte byte array */
    constructor(bytes) {
        this.bytes = bytes;
        if (bytes.length !== 16) {
            throw new TypeError("not 128-bit length");
        }
    }
    /**
     * Builds a byte array from UUIDv7 field values.
     *
     * @param unixTsMs - 48-bit `unix_ts_ms` field.
     * @param randA - 12-bit `rand_a` field.
     * @param randBHi - Higher 30 bits of 62-bit `rand_b` field.
     * @param randBLo - Lower 32 bits of 62-bit `rand_b` field.
     */
    static fromFieldsV7(unixTsMs, randA, randBHi, randBLo) {
        if (!Number.isInteger(unixTsMs) ||
            !Number.isInteger(randA) ||
            !Number.isInteger(randBHi) ||
            !Number.isInteger(randBLo) ||
            unixTsMs < 0 ||
            randA < 0 ||
            randBHi < 0 ||
            randBLo < 0 ||
            unixTsMs > 281474976710655 ||
            randA > 0xfff ||
            randBHi > 1073741823 ||
            randBLo > 4294967295) {
            throw new RangeError("invalid field value");
        }
        const bytes = new Uint8Array(16);
        bytes[0] = unixTsMs / Math.pow(2, 40);
        bytes[1] = unixTsMs / Math.pow(2, 32);
        bytes[2] = unixTsMs / Math.pow(2, 24);
        bytes[3] = unixTsMs / Math.pow(2, 16);
        bytes[4] = unixTsMs / Math.pow(2, 8);
        bytes[5] = unixTsMs;
        bytes[6] = 0x70 | (randA >>> 8);
        bytes[7] = randA;
        bytes[8] = 0x80 | (randBHi >>> 24);
        bytes[9] = randBHi >>> 16;
        bytes[10] = randBHi >>> 8;
        bytes[11] = randBHi;
        bytes[12] = randBLo >>> 24;
        bytes[13] = randBLo >>> 16;
        bytes[14] = randBLo >>> 8;
        bytes[15] = randBLo;
        return new UUID(bytes);
    }
    /** @returns 8-4-4-4-12 canonical hexadecimal string representation. */
    toString() {
        let text = "";
        for (let i = 0; i < this.bytes.length; i++) {
            text += DIGITS.charAt(this.bytes[i] >>> 4);
            text += DIGITS.charAt(this.bytes[i] & 0xf);
            if (i === 3 || i === 5 || i === 7 || i === 9) {
                text += "-";
            }
        }
        return text;
    }
    /** Creates an object from `this`. */
    clone() {
        return new UUID(this.bytes.slice(0));
    }
    /** Returns true if `this` is equivalent to `other`. */
    equals(other) {
        return this.compareTo(other) === 0;
    }
    /**
     * Returns a negative integer, zero, or positive integer if `this` is less
     * than, equal to, or greater than `other`, respectively.
     */
    compareTo(other) {
        for (let i = 0; i < 16; i++) {
            const diff = this.bytes[i] - other.bytes[i];
            if (diff !== 0) {
                return Math.sign(diff);
            }
        }
        return 0;
    }
}
exports.UUID = UUID;
/** Encapsulates the monotonic counter state. */
class V7Generator {
    constructor() {
        this.timestamp = 0;
        this.counter = 0;
        this.random = new DefaultRandom();
    }
    generate() {
        const ts = Date.now();
        if (ts > this.timestamp) {
            this.timestamp = ts;
            this.resetCounter();
        }
        else if (ts + 10000 > this.timestamp) {
            this.counter++;
            if (this.counter > 4398046511103) {
                // increment timestamp at counter overflow
                this.timestamp++;
                this.resetCounter();
            }
        }
        else {
            // reset state if clock moves back more than ten seconds
            this.timestamp = ts;
            this.resetCounter();
        }
        return UUID.fromFieldsV7(this.timestamp, Math.trunc(this.counter / Math.pow(2, 30)), this.counter & (Math.pow(2, 30) - 1), this.random.nextUint32());
    }
    /** Initializes counter at 42-bit random integer. */
    resetCounter() {
        this.counter =
            this.random.nextUint32() * 0x400 + (this.random.nextUint32() & 0x3ff);
    }
}
/** Stores `crypto.getRandomValues()` available in the environment. */
let getRandomValues = (buffer) => {
    // fall back on Math.random() unless the flag is set to true
    if (typeof UUIDV7_DENY_WEAK_RNG !== "undefined" && UUIDV7_DENY_WEAK_RNG) {
        throw new Error("no cryptographically strong RNG available");
    }
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] =
            Math.trunc(Math.random() * 65536) * 65536 +
                Math.trunc(Math.random() * 65536);
    }
    return buffer;
};
// detect Web Crypto API
if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    getRandomValues = (buffer) => crypto.getRandomValues(buffer);
}
/**
 * Wraps `crypto.getRandomValues()` and compatibles to enable buffering; this
 * uses a small buffer by default to avoid unbearable throughput decline in some
 * environments as well as the waste of time and space for unused values.
 */
class DefaultRandom {
    constructor() {
        this.buffer = new Uint32Array(8);
        this.cursor = Infinity;
    }
    nextUint32() {
        if (this.cursor >= this.buffer.length) {
            getRandomValues(this.buffer);
            this.cursor = 0;
        }
        return this.buffer[this.cursor++];
    }
}
let defaultGenerator;
/**
 * Generates a UUIDv7 string.
 *
 * @returns 8-4-4-4-12 canonical hexadecimal string representation
 * ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
 */
const uuidv7 = () => (0, exports.uuidv7obj)().toString();
exports.uuidv7 = uuidv7;
/** Generates a UUIDv7 object. */
const uuidv7obj = () => (defaultGenerator || (defaultGenerator = new V7Generator())).generate();
exports.uuidv7obj = uuidv7obj;
/**
 * Generates a UUIDv4 string.
 *
 * @returns 8-4-4-4-12 canonical hexadecimal string representation
 * ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
 */
const uuidv4 = () => (0, exports.uuidv4obj)().toString();
exports.uuidv4 = uuidv4;
/** Generates a UUIDv4 object. */
const uuidv4obj = () => {
    const bytes = getRandomValues(new Uint8Array(16));
    bytes[6] = 0x40 | (bytes[6] >>> 4);
    bytes[8] = 0x80 | (bytes[8] >>> 2);
    return new UUID(bytes);
};
exports.uuidv4obj = uuidv4obj;
