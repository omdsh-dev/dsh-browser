import { Checksum, SourceData } from "@smithy/types";
/**
 * SHA-256 using Node.js crypto native implementation when available,
 * falling back to the pure JS implementation.
 * @public
 */
export interface Sha256Node extends Checksum {
    readonly digestLength: 32;
}
/**
 * @public
 */
export declare const Sha256Node: new (secret?: SourceData) => Sha256Node;
