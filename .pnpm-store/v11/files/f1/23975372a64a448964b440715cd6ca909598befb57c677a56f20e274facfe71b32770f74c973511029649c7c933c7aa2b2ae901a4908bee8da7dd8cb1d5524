import { Writable, type WritableOptions } from "node:stream";
import type { Checksum, Hash } from "@smithy/types";
/**
 * @internal
 */
export declare class HashCalculator extends Writable {
    readonly hash: Checksum | Hash;
    constructor(hash: Checksum | Hash, options?: WritableOptions);
    _write(chunk: Buffer, encoding: string, callback: (err?: Error) => void): void;
}
