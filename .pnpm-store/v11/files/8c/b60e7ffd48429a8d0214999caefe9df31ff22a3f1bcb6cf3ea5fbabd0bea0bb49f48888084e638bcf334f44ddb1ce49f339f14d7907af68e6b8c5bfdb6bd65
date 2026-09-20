import type { Checksum, SourceData } from "@smithy/types";
/**
 * SHA-256 using the Web Crypto API (crypto.subtle) when available,
 * falling back to the pure JS implementation.
 *
 * Caution: this implementation is forced to buffer the data entirely.
 * Use the pure-JS or Sha256Node implementations for large streaming data.
 * @public
 */
export declare class Sha256WebCrypto implements Checksum {
    readonly digestLength: 32;
    private readonly secret?;
    private pending;
    private pendingBytes;
    private fallback?;
    private finished;
    constructor(secret?: SourceData);
    update(data: Uint8Array): void;
    digest(): Promise<Uint8Array>;
    reset(): void;
    private switchToFallback;
}
