/**
 * uuidv7: an experimental implementation of the proposed UUIDv7
 *
 * @license Apache-2.0
 * @copyright 2021 LiosK
 * @packageDocumentation
 */
/**
 * Generates a UUIDv7 hexadecimal string.
 *
 * @returns 8-4-4-4-12 hexadecimal string representation
 * ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
 */
export const uuidv7 = () => {
    const [ts, seq] = updateTsAndSeq();
    let hexTs = "00000000" + (ts / 1000).toString(16);
    hexTs += /\./.test(hexTs) ? "00" : ".000";
    const match = /([0-9a-f]{8})([0-9a-f])\.([0-9a-f]{3})/.exec(hexTs);
    if (match == null) {
        throw new Error(`assertion error: ${hexTs} !~ xxxxxxxxx.xxx`);
    }
    return (match[1] +
        "-" +
        match[2] +
        match[3] +
        "-" +
        hex(0x7000 | seq, 4) +
        "-" +
        hex(0x8000 | (Math.random() * 0x3fff), 4) +
        "-" +
        hex(Math.floor(Math.random() * 16777216) * 16777216 +
            Math.floor(Math.random() * 16777216), 12));
};
/** Formats a safe unsigned integer as `d`-digit hexadecimal string. */
const hex = (safeUint, d) => {
    return ("0000000000000" + safeUint.toString(16)).slice(-d);
};
/** Internal state - timestamp */
let ts = 0;
/** Internal state - sequence counter */
let seq = 0;
/**
 * Updates the internal state and returns the latest values.
 *
 * @returns [timestamp, sequence counter]
 */
const updateTsAndSeq = () => {
    let newTs = Date.now();
    if (ts < newTs) {
        ts = newTs;
        seq = 0;
    }
    else {
        seq++;
        if (seq > 0xfff) {
            // wait a moment until clock moves; reset state and continue otherwise
            for (let i = 0; ts >= newTs && i < 1000000; i++) {
                newTs = Date.now();
            }
            ts = newTs;
            seq = 0;
        }
    }
    return [ts, seq];
};
