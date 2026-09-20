import { SerdeContext } from "@smithy/core/protocols";
import { CborShapeSerializer2 } from "./codec-v2/CborShapeSerializer2";
import { CborShapeDeserializer2 } from "./codec-v2/CborShapeDeserializer2";
export class CborCodec extends SerdeContext {
    createSerializer() {
        const serializer = new CborShapeSerializer2();
        serializer.setSerdeContext(this.serdeContext);
        return serializer;
    }
    createDeserializer() {
        const deserializer = new CborShapeDeserializer2();
        deserializer.setSerdeContext(this.serdeContext);
        return deserializer;
    }
}
