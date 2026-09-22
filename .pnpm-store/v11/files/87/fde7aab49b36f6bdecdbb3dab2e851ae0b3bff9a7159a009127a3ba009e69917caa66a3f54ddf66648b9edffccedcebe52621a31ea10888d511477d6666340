import { EventStreamMarshaller as UniversalEventStreamMarshaller } from "../eventstream-serde-universal/EventStreamMarshaller";
import { iterableToReadableStream, readableStreamToIterable } from "./utils";
export class EventStreamMarshaller {
    universalMarshaller;
    constructor({ utf8Encoder, utf8Decoder }) {
        this.universalMarshaller = new UniversalEventStreamMarshaller({
            utf8Decoder,
            utf8Encoder,
        });
    }
    deserialize(body, deserializer) {
        const bodyIterable = isReadableStream(body) ? readableStreamToIterable(body) : body;
        return this.universalMarshaller.deserialize(bodyIterable, deserializer);
    }
    serialize(input, serializer) {
        const serializedIterable = this.universalMarshaller.serialize(input, serializer);
        return typeof ReadableStream === "function" ? iterableToReadableStream(serializedIterable) : serializedIterable;
    }
}
const isReadableStream = (body) => typeof ReadableStream === "function" && body instanceof ReadableStream;
export const eventStreamSerdeProvider = (options) => new EventStreamMarshaller(options);
