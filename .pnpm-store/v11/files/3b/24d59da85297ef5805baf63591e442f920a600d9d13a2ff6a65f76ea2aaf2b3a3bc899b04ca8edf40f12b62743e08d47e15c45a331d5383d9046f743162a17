import { NormalizedSchema, TypeRegistry, translateTraits } from "@smithy/core/schema";
import { HttpRequest, HttpResponse, isValidHostname } from "@smithy/core/transport";
import { SerdeContext } from "./SerdeContext";
export class HttpProtocol extends SerdeContext {
    options;
    compositeErrorRegistry;
    constructor(options) {
        super();
        this.options = options;
        this.compositeErrorRegistry = TypeRegistry.for(options.defaultNamespace);
        for (const etr of options.errorTypeRegistries ?? []) {
            this.compositeErrorRegistry.copyFrom(etr);
        }
    }
    getRequestType() {
        return HttpRequest;
    }
    getResponseType() {
        return HttpResponse;
    }
    setSerdeContext(serdeContext) {
        this.serdeContext = serdeContext;
        this.serializer.setSerdeContext(serdeContext);
        this.deserializer.setSerdeContext(serdeContext);
        if (this.getPayloadCodec()) {
            this.getPayloadCodec().setSerdeContext(serdeContext);
        }
    }
    updateServiceEndpoint(request, endpoint) {
        if ("url" in endpoint) {
            request.protocol = endpoint.url.protocol;
            request.hostname = endpoint.url.hostname;
            request.port = endpoint.url.port ? Number(endpoint.url.port) : undefined;
            request.path = endpoint.url.pathname;
            request.fragment = endpoint.url.hash || void 0;
            request.username = endpoint.url.username || void 0;
            request.password = endpoint.url.password || void 0;
            if (!request.query) {
                request.query = {};
            }
            for (const [k, v] of endpoint.url.searchParams.entries()) {
                request.query[k] = v;
            }
            if (endpoint.headers) {
                for (const name in endpoint.headers) {
                    request.headers[name] = endpoint.headers[name].join(", ");
                }
            }
            return request;
        }
        else {
            request.protocol = endpoint.protocol;
            request.hostname = endpoint.hostname;
            request.port = endpoint.port ? Number(endpoint.port) : undefined;
            request.path = endpoint.path;
            request.query = {
                ...endpoint.query,
            };
            if (endpoint.headers) {
                for (const name in endpoint.headers) {
                    request.headers[name] = endpoint.headers[name];
                }
            }
            return request;
        }
    }
    setHostPrefix(request, operationSchema, input) {
        if (this.serdeContext?.disableHostPrefix) {
            return;
        }
        const inputNs = NormalizedSchema.of(operationSchema.input);
        const opTraits = translateTraits(operationSchema.traits ?? {});
        if (opTraits.endpoint) {
            let hostPrefix = opTraits.endpoint?.[0];
            if (typeof hostPrefix === "string") {
                for (const [name, member] of inputNs.structIterator()) {
                    if (!member.getMergedTraits().hostLabel) {
                        continue;
                    }
                    const replacement = input[name];
                    if (typeof replacement !== "string") {
                        throw new Error(`@smithy/core/schema - ${name} in input must be a string as hostLabel.`);
                    }
                    hostPrefix = hostPrefix.replace(`{${name}}`, replacement);
                }
                request.hostname = hostPrefix + request.hostname;
                if (!isValidHostname(request.hostname)) {
                    throw new Error(`[${request.hostname}] is not a valid hostname.`);
                }
            }
        }
    }
    deserializeMetadata(output) {
        return {
            httpStatusCode: output.statusCode,
            requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
            extendedRequestId: output.headers["x-amz-id-2"],
            cfId: output.headers["x-amz-cf-id"],
        };
    }
    async serializeEventStream({ eventStream, requestSchema, initialRequest, }) {
        const eventStreamSerde = await this.loadEventStreamCapability();
        return eventStreamSerde.serializeEventStream({
            eventStream,
            requestSchema,
            initialRequest,
        });
    }
    async deserializeEventStream({ response, responseSchema, initialResponseContainer, }) {
        const eventStreamSerde = await this.loadEventStreamCapability();
        return eventStreamSerde.deserializeEventStream({
            response,
            responseSchema,
            initialResponseContainer,
        });
    }
    async loadEventStreamCapability() {
        const { EventStreamSerde, eventStreamSerdeProvider } = await import("@smithy/core/event-streams");
        const marshaller = this.resolveEventStreamMarshaller(eventStreamSerdeProvider);
        return new EventStreamSerde({
            marshaller,
            serializer: this.serializer,
            deserializer: this.deserializer,
            serdeContext: this.serdeContext,
            defaultContentType: this.getDefaultContentType(),
            compositeErrorRegistry: this.compositeErrorRegistry,
        });
    }
    resolveEventStreamMarshaller(importedProvider) {
        const context = this.serdeContext;
        if (context.eventStreamMarshaller) {
            return context.eventStreamMarshaller;
        }
        return importedProvider(this.serdeContext);
    }
    getDefaultContentType() {
        throw new Error(`@smithy/core/protocols - ${this.constructor.name} getDefaultContentType() implementation missing.`);
    }
    async deserializeHttpMessage(schema, context, response, arg4, arg5) {
        void schema;
        void context;
        void response;
        void arg4;
        void arg5;
        return [];
    }
    getEventStreamMarshaller() {
        const context = this.serdeContext;
        if (!context.eventStreamMarshaller) {
            throw new Error("@smithy/core - HttpProtocol: eventStreamMarshaller missing in serdeContext.");
        }
        return context.eventStreamMarshaller;
    }
}
