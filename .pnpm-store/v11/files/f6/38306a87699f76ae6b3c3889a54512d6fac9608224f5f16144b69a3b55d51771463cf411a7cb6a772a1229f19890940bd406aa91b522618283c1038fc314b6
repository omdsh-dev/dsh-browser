/**
 * Minimal binary protobuf reader.
 * Only implements the wire-types that we currently need; this is not intended
 * to be a general-purpose protobuf reader.
 *
 * Since the values we parse are generally small and not very nested, it's public
 * interface does not enforce the same low-allocation philosophy that ProtobufWriter does.
 * If this is needed in the future, we should refactor this to fit the use-case.
 */
export declare class ProtobufReader {
    pos: number;
    private readonly _buf;
    private readonly _textDecoder;
    constructor(buf: Uint8Array);
    isAtEnd(): boolean;
    /** Read a varint and decode it as a tag, returning field number and wire type. */
    readTag(): {
        fieldNumber: number;
        wireType: number;
    };
    /**
     * Read a base-128 varint.
     * Returns a JS `number`; precision above 2^53 is silently lost.
     * Throws if the buffer is truncated mid-varint.
     */
    readVarint(): number;
    /** Read a length-delimited byte sequence (bytes field or embedded message). */
    readBytes(): Uint8Array;
    /** Read a length-delimited UTF-8 string. */
    readString(): string;
    /**
     * Skip an unknown field.
     * Handles wire types 0 (varint), 1 (64-bit), 2 (length-delimited),
     * and 5 (32-bit).
     *
     * Wire types 3 and 4 (start-group / end-group) are deprecated in proto3
     * and are not used by any OpenTelemetry proto definition. Encountering
     * them is treated as an error.
     */
    skip(wireType: number): void;
}
//# sourceMappingURL=protobuf-reader.d.ts.map