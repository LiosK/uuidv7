/**
 * uuidv7: An experimental implementation of the proposed UUID Version 7
 *
 * @license Apache-2.0
 * @copyright 2021-2022 LiosK
 * @packageDocumentation
 */

import { randomFillSync } from "crypto";

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
  return UUID.fromWords(
    Math.trunc(timestamp / 0x1_0000),
    (timestamp % 0x1_0000) * 0x1_0000 + (0x7000 | (counter >>> 14)),
    (0x8000 | (counter & 0x3fff)) * 0x1_0000 + rand(16),
    rand(32)
  );
};

/** Returns a `k`-bit unsigned random integer. */
const rand: (k: number) => number = (() => {
  // detect CSPRNG
  if (typeof window !== "undefined" && window.crypto) {
    // Web Crypto API on browsers
    return (k: number) => {
      const [hi, lo] = window.crypto.getRandomValues(new Uint32Array(2));
      return k > 32 ? (hi % 2 ** (k - 32)) * 2 ** 32 + lo : lo % 2 ** k;
    };
  } else if (randomFillSync) {
    // Node.js Crypto
    return (k: number) => {
      const [hi, lo] = randomFillSync(new Uint32Array(2));
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

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

class UUID {
  private constructor(private readonly words: Uint32Array) {
    if (words.length !== 4) {
      throw new TypeError("words is not 128-bit length");
    }
  }

  static fromWords(w0: number, w1: number, w2: number, w3: number): UUID {
    return new UUID(Uint32Array.of(w0, w1, w2, w3));
  }

  toString(): string {
    const ds = this.convertRadix(this.words, new Uint8Array(32), 2 ** 32, 16);
    let text = "";
    for (let i = 0; i < ds.length; i++) {
      text += DIGITS.charAt(ds[i]);
      if (i === 7 || i === 11 || i === 15 || i === 19) {
        text += "-";
      }
    }
    return text;
  }

  toBase36String(): string {
    const ds = this.convertRadix(this.words, new Uint8Array(25), 2 ** 32, 36);
    let text = "";
    for (let i = 0; i < ds.length; i++) {
      text += DIGITS.charAt(ds[i]);
    }
    return text;
  }

  /** Converts a digit value array in `srcRadix` to that in `dstRadix`. */
  private convertRadix<T extends Uint8Array | Uint32Array>(
    src: Uint8Array | Uint32Array,
    dst: T,
    srcRadix: number,
    dstRadix: number
  ): T {
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
