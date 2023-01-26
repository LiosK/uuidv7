/**
 * uuidv7: An experimental implementation of the proposed UUID Version 7
 *
 * @license Apache-2.0
 * @copyright 2021-2023 LiosK
 * @packageDocumentation
 */
/** Represents a UUID as a 16-byte byte array. */
export declare class UUID {
    readonly bytes: Uint8Array;
    /** @param bytes - 16-byte byte array */
    constructor(bytes: Uint8Array);
    /**
     * Builds a byte array from UUIDv7 field values.
     *
     * @param unixTsMs - 48-bit `unix_ts_ms` field.
     * @param randA - 12-bit `rand_a` field.
     * @param randBHi - Higher 30 bits of 62-bit `rand_b` field.
     * @param randBLo - Lower 32 bits of 62-bit `rand_b` field.
     */
    static fromFieldsV7(unixTsMs: number, randA: number, randBHi: number, randBLo: number): UUID;
    /** @returns 8-4-4-4-12 canonical hexadecimal string representation. */
    toString(): string;
    /** Creates an object from `this`. */
    clone(): UUID;
    /** Returns true if `this` is equivalent to `other`. */
    equals(other: UUID): boolean;
    /**
     * Returns a negative integer, zero, or positive integer if `this` is less
     * than, equal to, or greater than `other`, respectively.
     */
    compareTo(other: UUID): number;
}
/**
 * Generates a UUIDv7 string.
 *
 * @returns 8-4-4-4-12 canonical hexadecimal string representation
 * ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
 */
export declare const uuidv7: () => string;
/** Generates a UUIDv7 object. */
export declare const uuidv7obj: () => UUID;
/**
 * Generates a UUIDv4 string.
 *
 * @returns 8-4-4-4-12 canonical hexadecimal string representation
 * ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
 */
export declare const uuidv4: () => string;
/** Generates a UUIDv4 object. */
export declare const uuidv4obj: () => UUID;
