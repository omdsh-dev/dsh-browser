import { Checksum, SourceData } from "@smithy/types";
/**
 * Pure JS SHA-256 implementation with HMAC support.
 * @see https://csrc.nist.gov/pubs/fips/180-4/upd1/final
 * @public
 */
export declare class Sha256Js implements Checksum {
    readonly digestLength = 32;
    /** Eight 32-bit words representing the current hash state. */
    private state;
    /** Reused message schedule array (W), allocated on first use of hashBuffer. */
    private w?;
    /** Accumulates input bytes until a full 64-byte block is ready. */
    private buffer;
    private bufferLength;
    private bytesHashed;
    private finished;
    private readonly inner?;
    private readonly outer?;
    constructor(secret?: SourceData);
    update(data: SourceData): void;
    digest(): Promise<Uint8Array>;
    reset(): void;
    private digestSync;
    private static normalizeKey;
    private hashBuffer;
    private hashBufferWith;
}
