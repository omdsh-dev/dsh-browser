import { SerdeContext } from "@smithy/core/protocols";
import { Schema, ShapeDeserializer } from "@smithy/types";
/**
 * Single-pass CBOR deserializer that reads bytes and applies Smithy schema
 * transformations in one traversal using module-level state.
 *
 * @internal
 */
export declare class CborShapeDeserializer2 extends SerdeContext implements ShapeDeserializer<Uint8Array> {
    read(schema: Schema, bytes: Uint8Array): any;
    /**
     * Deserialize a pre-decoded JS object per schema.
     * Used by protocol error handling which passes pre-decoded objects.
     *
     * @internal
     */
    readValue(_schema: Schema, value: any): any;
}
