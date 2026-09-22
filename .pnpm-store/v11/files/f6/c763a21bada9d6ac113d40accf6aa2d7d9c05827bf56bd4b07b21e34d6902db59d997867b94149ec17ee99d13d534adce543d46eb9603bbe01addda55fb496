import { EventStreamCodec } from "../eventstream-codec/EventStreamCodec";
import { MessageDecoderStream } from "../eventstream-codec/MessageDecoderStream";
import { MessageEncoderStream } from "../eventstream-codec/MessageEncoderStream";
import { SmithyMessageDecoderStream } from "../eventstream-codec/SmithyMessageDecoderStream";
import { SmithyMessageEncoderStream } from "../eventstream-codec/SmithyMessageEncoderStream";
import { getChunkedStream } from "./getChunkedStream";
import { getMessageUnmarshaller } from "./getUnmarshalledStream";
export class EventStreamMarshaller {
    eventStreamCodec;
    utfEncoder;
    constructor({ utf8Encoder, utf8Decoder }) {
        this.eventStreamCodec = new EventStreamCodec(utf8Encoder, utf8Decoder);
        this.utfEncoder = utf8Encoder;
    }
    deserialize(body, deserializer) {
        const inputStream = getChunkedStream(body);
        return new SmithyMessageDecoderStream({
            messageStream: new MessageDecoderStream({ inputStream, decoder: this.eventStreamCodec }),
            deserializer: getMessageUnmarshaller(deserializer, this.utfEncoder),
        });
    }
    serialize(inputStream, serializer) {
        return new MessageEncoderStream({
            messageStream: new SmithyMessageEncoderStream({ inputStream, serializer }),
            encoder: this.eventStreamCodec,
            includeEndFrame: true,
        });
    }
}
export const eventStreamSerdeProvider = (options) => new EventStreamMarshaller(options);
