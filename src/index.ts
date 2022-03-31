/**
 * uuidv7: An experimental implementation of the proposed UUID Version 7
 *
 * @license Apache-2.0
 * @copyright 2021-2022 LiosK
 * @packageDocumentation
 */

import * as nodeCrypto from "crypto";

const DIGITS = "0123456789abcdef";

class UUID {
  constructor(readonly bytes: Uint8Array) {
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
  static fromFieldsV7(
    unixTsMs: number,
    randA: number,
    randBHi: number,
    randBLo: number
  ): UUID {
    if (
      !Number.isInteger(unixTsMs) ||
      !Number.isInteger(randA) ||
      !Number.isInteger(randBHi) ||
      !Number.isInteger(randBLo) ||
      unixTsMs < 0 ||
      randA < 0 ||
      randBHi < 0 ||
      randBLo < 0 ||
      unixTsMs > 0xffff_ffff_ffff ||
      randA > 0xfff ||
      randBHi > 0x3fff_ffff ||
      randBLo > 0xffff_ffff
    ) {
      throw new RangeError("invalid field value");
    }

    const bytes = new Uint8Array(16);
    bytes[0] = unixTsMs / 2 ** 40;
    bytes[1] = unixTsMs / 2 ** 32;
    bytes[2] = unixTsMs / 2 ** 24;
    bytes[3] = unixTsMs / 2 ** 16;
    bytes[4] = unixTsMs / 2 ** 8;
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
  toString(): string {
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
export const uuidv7 = (): string => {
  return generateV7().toString();
};

const generateV7 = (): UUID => {
  const [timestamp, counter] = getTimestampAndCounter();
  return UUID.fromFieldsV7(
    timestamp,
    counter >>> 14,
    ((counter & 0x3fff) << 16) | rand(16),
    rand(32)
  );
};

/** Returns a `k`-bit unsigned random integer. */
const rand: (k: number) => number = (() => {
  // detect CSPRNG
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Web Crypto API
    return (k: number) => {
      const [hi, lo] = crypto.getRandomValues(new Uint32Array(2));
      return k > 32 ? (hi % 2 ** (k - 32)) * 2 ** 32 + lo : lo % 2 ** k;
    };
  } else if (nodeCrypto && nodeCrypto.randomFillSync) {
    // Node.js Crypto
    return (k: number) => {
      const [hi, lo] = nodeCrypto.randomFillSync(new Uint32Array(2));
      return k > 32 ? (hi % 2 ** (k - 32)) * 2 ** 32 + lo : lo % 2 ** k;
    };
  } else {
    return (k: number) =>
      k > 30
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
const getTimestampAndCounter = (): [number, number] => {
  let now = Date.now();
  if (timestamp < now) {
    timestamp = now;
    counter = rand(26);
  } else {
    counter++;
    if (counter > 0x3ff_ffff) {
      // wait a moment until clock moves; reset state and continue otherwise
      for (let i = 0; timestamp >= now && i < 1_000_000; i++) {
        now = Date.now();
      }
      timestamp = now;
      counter = rand(26);
    }
  }

  return [timestamp, counter];
};
