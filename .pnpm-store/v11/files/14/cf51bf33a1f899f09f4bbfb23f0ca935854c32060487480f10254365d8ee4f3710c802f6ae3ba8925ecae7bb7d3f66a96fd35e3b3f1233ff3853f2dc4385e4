import { Readable } from "node:stream";
import { EventStreamMarshaller as UniversalEventStreamMarshaller } from "../eventstream-serde-universal/EventStreamMarshaller";
export class EventStreamMarshaller {
    universalMarshaller;
    constructor({ utf8Encoder, utf8Decoder }) {
        this.universalMarshaller = new UniversalEventStreamMarshaller({
            utf8Decoder,
            utf8Encoder,
        });
    }
    deserialize(body, deserializer) {
        const bodyIterable = typeof body[Symbol.asyncIterator] === "function" ? body : readableToIterable(body);
        return this.universalMarshaller.deserialize(bodyIterable, deserializer);
    }
    serialize(input, serializer) {
        return Readable.from(this.universalMarshaller.serialize(input, serializer));
    }
}
export const eventStreamSerdeProvider = (options) => new EventStreamMarshaller(options);
export async function* readableToIterable(readStream) {
    let streamEnded = false;
    let generationEnded = false;
    const records = new Array();
    readStream.on("error", (err) => {
        if (!streamEnded) {
            streamEnded = true;
        }
        if (err) {
            throw err;
        }
    });
    readStream.on("data", (data) => {
        records.push(data);
    });
    readStream.on("end", () => {
        streamEnded = true;
    });
    while (!generationEnded) {
        const value = await new Promise((resolve) => setTimeout(() => resolve(records.shift()), 0));
        if (value) {
            yield value;
        }
        generationEnded = streamEnded && records.length === 0;
    }
}
