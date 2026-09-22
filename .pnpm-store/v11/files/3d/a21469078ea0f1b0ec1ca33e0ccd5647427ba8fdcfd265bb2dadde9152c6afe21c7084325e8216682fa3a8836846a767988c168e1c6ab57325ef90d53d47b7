import { SerdeContext } from "@smithy/core/protocols";
import { Codec } from "@smithy/types";
import { CborShapeSerializer2 } from "./codec-v2/CborShapeSerializer2";
import { CborShapeDeserializer2 } from "./codec-v2/CborShapeDeserializer2";
/**
 * @public
 */
export declare class CborCodec extends SerdeContext implements Codec<Uint8Array, Uint8Array> {
    createSerializer(): CborShapeSerializer2;
    createDeserializer(): CborShapeDeserializer2;
}
