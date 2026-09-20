import { type NormalizedSchema, TypeRegistry } from "@smithy/core/schema";
import type { EventStreamMarshaller, HttpRequest as IHttpRequest, HttpResponse as IHttpResponse, SerdeFunctions, ShapeDeserializer, ShapeSerializer } from "@smithy/types";
/**
 * Separated module for async mixin of EventStream serde capability.
 * This is used by the HttpProtocol base class from \@smithy/core/protocols.
 *
 * @public
 */
export declare class EventStreamSerde {
    private readonly marshaller;
    private readonly serializer;
    private readonly deserializer;
    private readonly serdeContext?;
    private readonly defaultContentType;
    private readonly compositeErrorRegistry?;
    /**
     * Properties are injected by the HttpProtocol.
     */
    constructor({ marshaller, serializer, deserializer, serdeContext, defaultContentType, compositeErrorRegistry, }: {
        marshaller: EventStreamMarshaller;
        serializer: ShapeSerializer<string | Uint8Array>;
        deserializer: ShapeDeserializer<string | Uint8Array>;
        serdeContext?: SerdeFunctions;
        defaultContentType: string;
        compositeErrorRegistry?: TypeRegistry;
    });
    /**
     * @param eventStream - the iterable provided by the caller.
     * @param requestSchema - the schema of the event stream container (struct).
     * @param [initialRequest] - only provided if the initial-request is part of the event stream (RPC).
     *
     * @returns a stream suitable for the HTTP body of a request.
     */
    serializeEventStream({ eventStream, requestSchema, initialRequest, initialMessageType, }: {
        eventStream: AsyncIterable<any>;
        requestSchema: NormalizedSchema;
        initialRequest?: any;
        /**
         * The :event-type header value for the initial message.
         * Defaults to "initial-request" (client→server).
         * Server→client should pass "initial-response".
         */
        initialMessageType?: string;
    }): Promise<IHttpRequest["body"] | Uint8Array>;
    /**
     * @param response - http response from which to read the event stream.
     * @param unionSchema - schema of the event stream container (struct).
     * @param [initialResponseContainer] - provided and written to only if the initial response is part of the event stream (RPC).
     *
     * @returns the asyncIterable of the event stream for the end-user.
     */
    deserializeEventStream({ response, responseSchema, initialResponseContainer, initialMessageType, }: {
        response: IHttpResponse;
        responseSchema: NormalizedSchema;
        initialResponseContainer?: any;
        /**
         * The :event-type header value to match as the initial message.
         * Defaults to "initial-response" (server→client).
         * Server-side deserialization of client requests should pass "initial-request".
         */
        initialMessageType?: string;
    }): Promise<AsyncIterable<{
        [key: string]: any;
        $unknown?: unknown;
    }>>;
    /**
     * Reads and returns an event member. For error schemas, resolves the registered
     * error constructor from the TypeRegistry and wraps the deserialized value
     * so that it can be thrown as a typed exception instance by the caller.
     */
    private readEventMember;
    /**
     * @param unionMember - member name within the structure that contains an event stream union.
     * @param unionSchema - schema of the union.
     * @param event
     *
     * @returns the event body (bytes) and event type (string).
     */
    private writeEventBody;
}
