import { type CborValueType, type Float32, type Uint8, type Uint32 } from "./cbor-types";
/**
 * Sets the decode bytearray source and its data view.
 *
 * @internal
 * @param bytes - to be set as the decode source.
 */
export declare function setPayload(bytes: Uint8Array): void;
/**
 * Decodes the data between the two indices.
 *
 * @internal
 */
export declare function decode(at: Uint32, to: Uint32): CborValueType;
/**
 * @internal
 */
export declare function bytesToFloat16(a: Uint8, b: Uint8): Float32;
/**
 * @internal
 */
export declare function advanceDecodingEpoch(): void;
