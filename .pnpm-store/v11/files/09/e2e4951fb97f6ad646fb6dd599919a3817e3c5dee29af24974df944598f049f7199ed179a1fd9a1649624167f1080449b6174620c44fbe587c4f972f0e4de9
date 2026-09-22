import type { Checksum, SourceData } from "@smithy/types";
/**
 * MD5 using Node.js crypto native implementation when available,
 * falling back to the pure JS implementation.
 * @public
 */
export interface Md5Node extends Checksum {
    readonly digestLength: 16;
    /**
     * @override
     */
    update(data: SourceData): void;
}
/**
 * @public
 */
export declare const Md5Node: new () => Md5Node;
