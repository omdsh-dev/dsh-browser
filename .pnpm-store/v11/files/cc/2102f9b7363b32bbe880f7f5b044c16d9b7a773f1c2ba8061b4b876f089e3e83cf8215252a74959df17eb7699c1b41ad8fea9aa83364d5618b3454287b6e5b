import { SerdeContext } from "@smithy/core/protocols";
import { NormalizedSchema } from "@smithy/core/schema";
import type { Schema, ShapeSerializer } from "@smithy/types";
/**
 * Single-pass CBOR serializer that walks the Smithy schema and writes CBOR bytes
 * directly to a module-level buffer in one traversal. Eliminates the intermediate
 * JS object tree that the multi-pass CborShapeSerializer builds.
 *
 * @internal
 */
export declare class CborShapeSerializer2 extends SerdeContext implements ShapeSerializer<Uint8Array> {
    write(schema: Schema, value: unknown): void;
    flush(): Uint8Array;
}
/**
 * Advance the encoding epoch. Call between serialization batches
 * to allow stale cache entries to be evicted.
 *
 * @internal
 */
export declare function advanceSinglePassEncodingEpoch(): void;
/**
 * Cached CBOR struct iteration data: parallel arrays for direct indexed access.
 */
export interface CborStructCache {
    memberNames: string[];
    memberSchemas: NormalizedSchema[];
    encodedKeys: Uint8Array[];
}
/**
 * Builds or retrieves the CBOR-specific struct cache for a given NormalizedSchema.
 * On first call, iterates structIterator() to populate NormalizedSchema's own cache,
 * then builds pre-encoded CBOR key bytes for each member.
 */
export declare function loadCborStructIterator(ns: NormalizedSchema): CborStructCache;
