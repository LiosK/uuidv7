/**
 * uuidv7: an experimental implementation of the proposed UUIDv7
 *
 * @license Apache-2.0
 * @copyright 2021 LiosK
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
  const [ts, seq] = updateTsAndSeq();

  let hexTs = "00000000" + (ts / 1000).toString(16);
  hexTs += /\./.test(hexTs) ? "00" : ".000";
  const match = /([0-9a-f]{8})([0-9a-f])\.([0-9a-f]{3})/.exec(hexTs);
  if (match == null) {
    throw new Error(`assertion error: ${hexTs} !~ xxxxxxxxx.xxx`);
  }

  return (
    match[1] +
    "-" +
    match[2] +
    match[3] +
    "-" +
    hex(0x7000 | seq, 4) +
    "-" +
    hex(0x8000 | rand(14), 4) +
    "-" +
    hex(rand(48), 12)
  );
};

/** Formats a safe unsigned integer as `k`-digit hexadecimal string. */
const hex = (safeUint: number, k: number): string => {
  return ("0000000000000" + safeUint.toString(16)).slice(-k);
};

/** Returns an `k`-bit unsigned random integer. */
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

/** Internal state - timestamp */
let ts = 0;

/** Internal state - sequence counter */
let seq = 0;

/** Internal state - bit width of maximum initial value of seq */
let maxInitialSeqLen = 11;

/**
 * Updates the internal state and returns the latest values.
 *
 * @returns [timestamp, sequence counter]
 */
const updateTsAndSeq = (): [number, number] => {
  let newTs = Date.now();
  if (ts < newTs) {
    ts = newTs;
    seq = rand(maxInitialSeqLen);
  } else {
    seq++;

    if (seq > 0xfff) {
      // gradually reduce initial seq to zero when seq overflows
      if (maxInitialSeqLen > 0) {
        maxInitialSeqLen--;
      }

      // wait a moment until clock moves; reset state and continue otherwise
      for (let i = 0; ts >= newTs && i < 1_000_000; i++) {
        newTs = Date.now();
      }
      ts = newTs;
      seq = rand(maxInitialSeqLen);
    }
  }
  return [ts, seq];
};
