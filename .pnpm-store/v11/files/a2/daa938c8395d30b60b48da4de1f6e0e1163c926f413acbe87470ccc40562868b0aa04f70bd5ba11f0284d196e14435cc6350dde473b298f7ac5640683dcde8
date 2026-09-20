import type { Checksum } from "@smithy/types";
/**
 * Pure JS CRC-32 implementation using the IEEE 802.3 polynomial.
 * @see https://www.w3.org/TR/png/#D-CRCAppendix
 * @public
 */
export declare class Crc32Js implements Checksum {
    readonly digestLength = 4;
    private checksum;
    update(data: Uint8Array): void;
    /**
     * Used by EventStreamCodec.
     * @internal
     */
    digestSync(): number;
    digest(): Promise<Uint8Array>;
    reset(): void;
}
