import { SerdeContext } from "@smithy/core/protocols";
import { Schema, ShapeSerializer } from "@smithy/types";
/**
 * @public
 */
export declare class CborShapeSerializer extends SerdeContext implements ShapeSerializer {
    private value;
    write(schema: Schema, value: unknown): void;
    /**
     * Recursive serializer transform that copies and prepares the user input object
     * for CBOR serialization.
     */
    serialize(schema: Schema, source: unknown): any;
    flush(): Uint8Array;
}
