/**
 * uuidv7: An experimental implementation of the proposed UUID Version 7
 *
 * @license Apache-2.0
 * @copyright 2021-2023 LiosK
 * @packageDocumentation
 */
/** Represents a UUID as a 16-byte byte array. */
export declare class UUID {
    readonly bytes: Readonly<Uint8Array>;
    /** @param bytes - The 16-byte byte array representation. */
    private constructor();
    /**
     * Creates an object from the internal representation, a 16-byte byte array
     * containing the binary UUID representation in the big-endian byte order.
     *
     * This method does NOT shallow-copy the argument, and thus the created object
     * holds the reference to the underlying buffer.
     *
     * @throws TypeError if the length of the argument is not 16.
     */
    static ofInner(bytes: Readonly<Uint8Array>): UUID;
    /**
     * Builds a byte array from UUIDv7 field values.
     *
     * @param unixTsMs - A 48-bit `unix_ts_ms` field value.
     * @param randA - A 12-bit `rand_a` field value.
     * @param randBHi - The higher 30 bits of 62-bit `rand_b` field value.
     * @param randBLo - The lower 32 bits of 62-bit `rand_b` field value.
     * @throws RangeError if any field value is out of the specified range.
     */
    static fromFieldsV7(unixTsMs: number, randA: number, randBHi: number, randBLo: number): UUID;
    /**
     * Builds a byte array from the 8-4-4-4-12 canonical hexadecimal string
     * representation.
     *
     * This method is currently provided on an experimental basis and may be
     * changed or removed in the future.
     *
     * @throws SyntaxError if the argument could not parse as a valid UUID string.
     * @experimental
     */
    static parse(uuid: string): UUID;
    /** @returns The 8-4-4-4-12 canonical hexadecimal string representation. */
    toString(): string;
    /** @returns The 8-4-4-4-12 canonical hexadecimal string representation. */
    toJSON(): string;
    /**
     * A deprecated synonym for {@link getVariant}.
     *
     * @deprecated
     * @hidden
     */
    getType(): "VAR_0" | "VAR_10" | "VAR_110" | "VAR_RESERVED" | "NIL" | "MAX";
    /**
     * Reports the variant field value of the UUID or, if appropriate, "NIL" or
     * "MAX".
     *
     * For convenience, this method reports "NIL" or "MAX" if `this` represents
     * the Nil or Max UUID, although the Nil and Max UUIDs are technically
     * subsumed under the variants `0b0` and `0b111`, respectively.
     */
    getVariant(): "VAR_0" | "VAR_10" | "VAR_110" | "VAR_RESERVED" | "NIL" | "MAX";
    /**
     * Returns the version field value of the UUID or `undefined` if the UUID does
     * not have the variant field value of `0b10`.
     */
    getVersion(): number | undefined;
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
 * @returns The 8-4-4-4-12 canonical hexadecimal string representation
 * ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
 */
export declare const uuidv7: () => string;
/** Generates a UUIDv7 object. */
export declare const uuidv7obj: () => UUID;
/**
 * Generates a UUIDv4 string.
 *
 * @returns The 8-4-4-4-12 canonical hexadecimal string representation
 * ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
 */
export declare const uuidv4: () => string;
/** Generates a UUIDv4 object. */
export declare const uuidv4obj: () => UUID;
