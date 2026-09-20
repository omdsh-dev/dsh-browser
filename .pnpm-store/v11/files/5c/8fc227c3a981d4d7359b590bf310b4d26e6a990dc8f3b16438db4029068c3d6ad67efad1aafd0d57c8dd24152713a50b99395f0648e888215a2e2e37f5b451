import { Checksum } from "@smithy/types";
/**
 * CRC-32 using Node.js zlib native implementation when available,
 * falling back to the pure JS implementation.
 * @public
 */
export interface Crc32Node extends Checksum {
    readonly digestLength: 4;
    /**
     * Used by EventStreamCodec.
     * @internal
     */
    digestSync(): number;
}
/**
 * @public
 */
export declare const Crc32Node: new () => Crc32Node;
