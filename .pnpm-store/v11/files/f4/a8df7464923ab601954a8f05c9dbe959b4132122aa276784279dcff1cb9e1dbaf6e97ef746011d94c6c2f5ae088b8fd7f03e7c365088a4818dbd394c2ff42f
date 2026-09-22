import { Readable } from "node:stream";
import type { Decoder, Encoder, EventStreamSerdeProvider, EventStreamMarshaller as IEventStreamMarshaller, Message } from "@smithy/types";
/**
 * @internal
 */
export interface EventStreamMarshallerOptions {
    utf8Encoder: Encoder;
    utf8Decoder: Decoder;
}
/**
 * @internal
 */
export declare class EventStreamMarshaller implements IEventStreamMarshaller {
    private readonly universalMarshaller;
    constructor({ utf8Encoder, utf8Decoder }: EventStreamMarshallerOptions);
    deserialize<T>(body: Readable, deserializer: (input: Record<string, Message>) => Promise<T>): AsyncIterable<T>;
    serialize<T>(input: AsyncIterable<T>, serializer: (event: T) => Message): Readable;
}
/**
 * @internal
 */
export declare const eventStreamSerdeProvider: EventStreamSerdeProvider;
/**
 * Convert object stream piped in into an async iterable. This
 * adaptor should be deprecated when Node stream iterator is stable.
 * Caveat: this adaptor won't have backpressure to inwards stream
 *
 * Reference: https://nodejs.org/docs/latest-v11.x/api/stream.html#stream_readable_symbol_asynciterator
 * @internal
 */
export declare function readableToIterable<T>(readStream: Readable): AsyncIterable<T>;
