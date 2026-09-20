import type { IProtobufWriter } from './i-protobuf-writer';
export declare const GROWING_BUFFER_DEBUG_MESSAGE = "ProtobufWriter: estimated size was too small, growing buffer.";
/**
 * Primitive protobuf writer, optimized to avoid small object allocations.
 * Grows buffer dynamically if initial size is exceeded.
 */
export declare class ProtobufWriter implements IProtobufWriter {
    private _buffer;
    private readonly _textEncoder;
    private _dataView;
    pos: number;
    constructor(estimatedSize?: number);
    /**
     * Ensure buffer has capacity for at least size more bytes
     */
    private _ensureCapacity;
    /**
     * Get the written bytes as a Uint8Array
     */
    finish(): Uint8Array;
    /**
     * Insert placeholder for length. Update later with {@link finishLengthDelimited}
     * Returns the position where to write the length.
     */
    startLengthDelimited(): number;
    /**
     * Write length varint at placeholder position and shift content forward if needed.
     * Most messages are small (< 128 bytes), so we reserve 1 byte and only shift
     * when the length needs more bytes.
     */
    finishLengthDelimited(pos: number, length: number): void;
    /**
     * Write a sint32 value using zigzag encoding
     */
    writeSint32(value: number): void;
    /**
     * Write a signed 64-bit fixed integer (sfixed64) from a JS number.
     * Handles negative values via two's complement.
     */
    writeSfixed64(value: number): void;
    /**
     * Write a varint (variable-length integer)
     */
    writeVarint(value: number): void;
    /**
     * Write a 32-bit fixed integer (little-endian)
     */
    writeFixed32(value: number): void;
    /**
     * Write a 64-bit fixed integer (little-endian)
     * @param low - Low 32 bits
     * @param high - High 32 bits
     */
    writeFixed64(low: number, high: number): void;
    /**
     * Write length-delimited data (varint length + bytes)
     */
    writeBytes(bytes: Uint8Array): void;
    /**
     * Write a field key (field number + wire type)
     */
    writeTag(fieldNumber: number, wireType: number): void;
    /**
     * Write a double (64-bit IEEE 754)
     */
    writeDouble(value: number): void;
    /**
     * Write a string as UTF-8 bytes (length-delimited)
     */
    writeString(str: string): void;
}
//# sourceMappingURL=protobuf-writer.d.ts.map