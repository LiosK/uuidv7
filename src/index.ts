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
  const [timestamp, counter] = getTimestampAndCounter();

  return (
    hex(Math.trunc(timestamp / 0x1_0000), 8) +
    "-" +
    hex(timestamp % 0x1_0000, 4) +
    "-" +
    hex(0x7000 | (counter >>> 14), 4) +
    "-" +
    hex(0x8000 | (counter & 0x3fff), 4) +
    "-" +
    hex(rand(48), 12)
  );
};

/** Formats a safe unsigned integer as `k`-digit hexadecimal string. */
const hex = (safeUint: number, k: number): string => {
  return ("0000000000000" + safeUint.toString(16)).slice(-k);
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
