"use strict";
/**
 * uuidv7: An experimental implementation of the proposed UUID Version 7
 *
 * @license Apache-2.0
 * @copyright 2021-2022 LiosK
 * @packageDocumentation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidv7 = void 0;
const nodeCrypto = __importStar(require("crypto"));
const DIGITS = "0123456789abcdef";
class UUID {
    constructor(bytes) {
        this.bytes = bytes;
        if (bytes.length !== 16) {
            throw new TypeError("not 128-bit length");
        }
    }
    /**
     *  @param unixTsMs - 48 bits
     *  @param randA - 12 bits
     *  @param randBHi - 30 bits
     *  @param randBLo - 32 bits
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
    /** @returns 8-4-4-4-12 hexadecimal string representation. */
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
}
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
    return UUID.fromFieldsV7(timestamp, counter >>> 14, ((counter & 0x3fff) << 16) | rand(16), rand(32));
};
/** Returns a `k`-bit unsigned random integer. */
const rand = (() => {
    // detect CSPRNG
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        // Web Crypto API
        return (k) => {
            const [hi, lo] = crypto.getRandomValues(new Uint32Array(2));
            return k > 32 ? (hi % Math.pow(2, (k - 32))) * Math.pow(2, 32) + lo : lo % Math.pow(2, k);
        };
    }
    else if (nodeCrypto && nodeCrypto.randomFillSync) {
        // Node.js Crypto
        return (k) => {
            const [hi, lo] = nodeCrypto.randomFillSync(new Uint32Array(2));
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
