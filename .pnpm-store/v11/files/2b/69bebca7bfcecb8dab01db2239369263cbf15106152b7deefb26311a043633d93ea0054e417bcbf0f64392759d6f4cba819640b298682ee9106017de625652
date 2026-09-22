import type { Checksum, SourceData } from "@smithy/types";
/**
 * Pure-JS MD5 implementation. Used as fallback where node:crypto is unavailable.
 *
 * @public
 */
export declare class Md5Js implements Checksum {
    readonly digestLength = 16;
    private state;
    private writeBuffer;
    private bufferLength;
    private bytesHashed;
    update(sourceData: SourceData): void;
    /**
     * Non-destructive: works on copies so update() may continue after digest().
     */
    digest(): Promise<Uint8Array>;
    reset(): void;
}
