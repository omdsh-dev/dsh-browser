import { SerdeContext } from "@smithy/core/protocols";
import type { Schema, ShapeDeserializer } from "@smithy/types";
/**
 * @public
 */
export declare class CborShapeDeserializer extends SerdeContext implements ShapeDeserializer {
    read(schema: Schema, bytes: Uint8Array): any;
    /**
     * Public because it's called by the protocol implementation to deserialize errors.
     * @internal
     */
    readValue(_schema: Schema, value: any): any;
}
