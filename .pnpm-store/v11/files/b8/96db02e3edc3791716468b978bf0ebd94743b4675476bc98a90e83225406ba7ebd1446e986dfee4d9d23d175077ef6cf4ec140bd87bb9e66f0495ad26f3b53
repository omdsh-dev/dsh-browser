const { Uint8ArrayBlobAdapter, sdkStreamMixin, splitEvery, splitHeader, fromBase64, _parseEpochTimestamp, _parseRfc7231DateTime, _parseRfc3339DateTimeWithOffset, LazyJsonString, NumericValue, toUtf8, fromUtf8, generateIdempotencyToken, toBase64, dateToUtcString, quoteHeader } = require("@smithy/core/serde");
const { TypeRegistry, NormalizedSchema, translateTraits } = require("@smithy/core/schema");
const { HttpRequest, HttpResponse, isValidHostname } = require("@smithy/core/transport");
const { parseQueryString, parseUrl } = require("@smithy/core/transport");
exports.HttpRequest = HttpRequest;
exports.HttpResponse = HttpResponse;
exports.isValidHostname = isValidHostname;
exports.parseQueryString = parseQueryString;
exports.parseUrl = parseUrl;
const { FieldPosition } = require("@smithy/types");

const collectBody = async (streamBody = new Uint8Array(), context) => {
    if (streamBody instanceof Uint8Array) {
        return Uint8ArrayBlobAdapter.mutate(streamBody);
    }
    if (!streamBody) {
        return Uint8ArrayBlobAdapter.mutate(new Uint8Array());
    }
    const fromContext = context.streamCollector(streamBody);
    return Uint8ArrayBlobAdapter.mutate(await fromContext);
};

function extendedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return "%" + c.charCodeAt(0).toString(16).toUpperCase();
    });
}

class SerdeContext {
    serdeContext;
    setSerdeContext(serdeContext) {
        this.serdeContext = serdeContext;
    }
}

class HttpProtocol extends SerdeContext {
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
        const { EventStreamSerde, eventStreamSerdeProvider } = require('@smithy/core/event-streams');
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

class HttpBindingProtocol extends HttpProtocol {
    async serializeRequest(operationSchema, _input, context) {
        const input = _input && typeof _input === "object" ? _input : {};
        const serializer = this.serializer;
        const query = {};
        const headers = {};
        const endpoint = await context.endpoint();
        const ns = NormalizedSchema.of(operationSchema?.input);
        const payloadMemberNames = [];
        const payloadMemberSchemas = [];
        let hasNonHttpBindingMember = false;
        let payload;
        const request = new HttpRequest({
            protocol: "",
            hostname: "",
            port: undefined,
            path: "",
            fragment: undefined,
            query: query,
            headers: headers,
            body: undefined,
        });
        if (endpoint) {
            this.updateServiceEndpoint(request, endpoint);
            this.setHostPrefix(request, operationSchema, input);
            const opTraits = translateTraits(operationSchema.traits);
            if (opTraits.http) {
                request.method = opTraits.http[0];
                const [path, search] = opTraits.http[1].split("?");
                if (request.path == "/") {
                    request.path = path;
                }
                else {
                    request.path += path;
                }
                const traitSearchParams = new URLSearchParams(search ?? "");
                for (const [key, value] of traitSearchParams) {
                    query[key] = value;
                }
            }
        }
        for (const [memberName, memberNs] of ns.structIterator()) {
            const memberTraits = memberNs.getMergedTraits() ?? {};
            const inputMemberValue = input[memberName];
            if (inputMemberValue == null && !memberNs.isIdempotencyToken()) {
                if (memberTraits.httpLabel) {
                    if (request.path.includes(`{${memberName}+}`) || request.path.includes(`{${memberName}}`)) {
                        throw new Error(`No value provided for input HTTP label: ${memberName}.`);
                    }
                }
                continue;
            }
            if (memberTraits.httpPayload) {
                const isStreaming = memberNs.isStreaming();
                if (isStreaming) {
                    const isEventStream = memberNs.isStructSchema();
                    if (isEventStream) {
                        if (input[memberName]) {
                            payload = await this.serializeEventStream({
                                eventStream: input[memberName],
                                requestSchema: ns,
                            });
                        }
                    }
                    else {
                        payload = inputMemberValue;
                    }
                }
                else {
                    serializer.write(memberNs, inputMemberValue);
                    payload = serializer.flush();
                }
            }
            else if (memberTraits.httpLabel) {
                serializer.write(memberNs, inputMemberValue);
                const replacement = serializer.flush();
                if (request.path.includes(`{${memberName}+}`)) {
                    request.path = request.path.replace(`{${memberName}+}`, replacement.split("/").map(extendedEncodeURIComponent).join("/"));
                }
                else if (request.path.includes(`{${memberName}}`)) {
                    request.path = request.path.replace(`{${memberName}}`, extendedEncodeURIComponent(replacement));
                }
            }
            else if (memberTraits.httpHeader) {
                serializer.write(memberNs, inputMemberValue);
                headers[memberTraits.httpHeader.toLowerCase()] = String(serializer.flush());
            }
            else if (typeof memberTraits.httpPrefixHeaders === "string") {
                for (const key in inputMemberValue) {
                    const val = inputMemberValue[key];
                    const amalgam = memberTraits.httpPrefixHeaders + key;
                    serializer.write([memberNs.getValueSchema(), { httpHeader: amalgam }], val);
                    headers[amalgam.toLowerCase()] = serializer.flush();
                }
            }
            else if (memberTraits.httpQuery || memberTraits.httpQueryParams) {
                this.serializeQuery(memberNs, inputMemberValue, query);
            }
            else {
                hasNonHttpBindingMember = true;
                payloadMemberNames.push(memberName);
                payloadMemberSchemas.push(memberNs);
            }
        }
        if (hasNonHttpBindingMember && input) {
            const [namespace, name] = (ns.getName(true) ?? "#Unknown").split("#");
            const requiredMembers = ns.getSchema()[6];
            const payloadSchema = [
                3,
                namespace,
                name,
                ns.getMergedTraits(),
                payloadMemberNames,
                payloadMemberSchemas,
                undefined,
            ];
            if (requiredMembers) {
                payloadSchema[6] = requiredMembers;
            }
            else {
                payloadSchema.pop();
            }
            serializer.write(payloadSchema, input);
            payload = serializer.flush();
        }
        request.headers = headers;
        request.query = query;
        request.body = payload;
        return request;
    }
    serializeQuery(ns, data, query) {
        const serializer = this.serializer;
        const traits = ns.getMergedTraits();
        if (traits.httpQueryParams) {
            for (const key in data) {
                if (!(key in query)) {
                    const val = data[key];
                    const valueSchema = ns.getValueSchema();
                    Object.assign(valueSchema.getMergedTraits(), {
                        ...traits,
                        httpQuery: key,
                        httpQueryParams: undefined,
                    });
                    this.serializeQuery(valueSchema, val, query);
                }
            }
            return;
        }
        if (ns.isListSchema()) {
            const sparse = !!ns.getMergedTraits().sparse;
            const buffer = [];
            for (const item of data) {
                serializer.write([ns.getValueSchema(), traits], item);
                const serializable = serializer.flush();
                if (sparse || serializable !== undefined) {
                    buffer.push(serializable);
                }
            }
            query[traits.httpQuery] = buffer;
        }
        else {
            serializer.write([ns, traits], data);
            query[traits.httpQuery] = serializer.flush();
        }
    }
    async deserializeResponse(operationSchema, context, response) {
        const deserializer = this.deserializer;
        const ns = NormalizedSchema.of(operationSchema.output);
        const dataObject = {};
        if (response.statusCode >= 300) {
            const bytes = await collectBody(response.body, context);
            if (bytes.byteLength > 0) {
                Object.assign(dataObject, await deserializer.read(15, bytes));
            }
            await this.handleError(operationSchema, context, response, dataObject, this.deserializeMetadata(response));
            throw new Error("@smithy/core/protocols - HTTP Protocol error handler failed to throw.");
        }
        for (const header in response.headers) {
            const value = response.headers[header];
            delete response.headers[header];
            response.headers[header.toLowerCase()] = value;
        }
        const nonHttpBindingMembers = await this.deserializeHttpMessage(ns, context, response, dataObject);
        if (nonHttpBindingMembers.length) {
            const bytes = await collectBody(response.body, context);
            if (bytes.byteLength > 0) {
                const dataFromBody = await deserializer.read(ns, bytes);
                for (const member of nonHttpBindingMembers) {
                    if (dataFromBody[member] != null) {
                        dataObject[member] = dataFromBody[member];
                    }
                }
            }
        }
        else if (nonHttpBindingMembers.discardResponseBody) {
            await collectBody(response.body, context);
        }
        dataObject.$metadata = this.deserializeMetadata(response);
        return dataObject;
    }
    async deserializeHttpMessage(schema, context, response, arg4, arg5) {
        let dataObject;
        if (arg4 instanceof Set) {
            dataObject = arg5;
        }
        else {
            dataObject = arg4;
        }
        let discardResponseBody = true;
        const deserializer = this.deserializer;
        const ns = NormalizedSchema.of(schema);
        const nonHttpBindingMembers = [];
        for (const [memberName, memberSchema] of ns.structIterator()) {
            const memberTraits = memberSchema.getMemberTraits();
            if (memberTraits.httpPayload) {
                discardResponseBody = false;
                const isStreaming = memberSchema.isStreaming();
                if (isStreaming) {
                    const isEventStream = memberSchema.isStructSchema();
                    if (isEventStream) {
                        dataObject[memberName] = await this.deserializeEventStream({
                            response,
                            responseSchema: ns,
                        });
                    }
                    else {
                        dataObject[memberName] = sdkStreamMixin(response.body);
                    }
                }
                else if (response.body) {
                    const bytes = await collectBody(response.body, context);
                    if (bytes.byteLength > 0) {
                        dataObject[memberName] = await deserializer.read(memberSchema, bytes);
                    }
                }
            }
            else if (memberTraits.httpHeader) {
                const key = String(memberTraits.httpHeader).toLowerCase();
                const value = response.headers[key];
                if (null != value) {
                    if (memberSchema.isListSchema()) {
                        const headerListValueSchema = memberSchema.getValueSchema();
                        headerListValueSchema.getMergedTraits().httpHeader = key;
                        let sections;
                        if (headerListValueSchema.isTimestampSchema() &&
                            headerListValueSchema.getSchema() === 4) {
                            sections = splitEvery(value, ",", 2);
                        }
                        else {
                            sections = splitHeader(value);
                        }
                        const list = [];
                        for (const section of sections) {
                            list.push(await deserializer.read(headerListValueSchema, section.trim()));
                        }
                        dataObject[memberName] = list;
                    }
                    else {
                        dataObject[memberName] = await deserializer.read(memberSchema, value);
                    }
                }
            }
            else if (memberTraits.httpPrefixHeaders !== undefined) {
                dataObject[memberName] = {};
                for (const header in response.headers) {
                    if (header.startsWith(memberTraits.httpPrefixHeaders)) {
                        const value = response.headers[header];
                        const valueSchema = memberSchema.getValueSchema();
                        valueSchema.getMergedTraits().httpHeader = header;
                        dataObject[memberName][header.slice(memberTraits.httpPrefixHeaders.length)] = await deserializer.read(valueSchema, value);
                    }
                }
            }
            else if (memberTraits.httpResponseCode) {
                dataObject[memberName] = response.statusCode;
            }
            else {
                nonHttpBindingMembers.push(memberName);
            }
        }
        nonHttpBindingMembers.discardResponseBody = discardResponseBody;
        return nonHttpBindingMembers;
    }
}

class RpcProtocol extends HttpProtocol {
    async serializeRequest(operationSchema, _input, context) {
        const serializer = this.serializer;
        const query = {};
        const headers = {};
        const endpoint = await context.endpoint();
        const ns = NormalizedSchema.of(operationSchema?.input);
        const schema = ns.getSchema();
        let payload;
        const input = _input && typeof _input === "object" ? _input : {};
        const request = new HttpRequest({
            protocol: "",
            hostname: "",
            port: undefined,
            path: "/",
            fragment: undefined,
            query: query,
            headers: headers,
            body: undefined,
        });
        if (endpoint) {
            this.updateServiceEndpoint(request, endpoint);
            this.setHostPrefix(request, operationSchema, input);
        }
        if (input) {
            const eventStreamMember = ns.getEventStreamMember();
            if (eventStreamMember) {
                if (input[eventStreamMember]) {
                    const initialRequest = {};
                    for (const [memberName] of ns.structIterator()) {
                        if (memberName !== eventStreamMember && input[memberName] != null) {
                            initialRequest[memberName] = input[memberName];
                        }
                    }
                    payload = await this.serializeEventStream({
                        eventStream: input[eventStreamMember],
                        requestSchema: ns,
                        initialRequest,
                    });
                }
            }
            else {
                serializer.write(schema, input);
                payload = serializer.flush();
            }
        }
        request.headers = Object.assign(request.headers, headers);
        request.query = query;
        request.body = payload;
        request.method = "POST";
        return request;
    }
    async deserializeResponse(operationSchema, context, response) {
        const deserializer = this.deserializer;
        const ns = NormalizedSchema.of(operationSchema.output);
        const dataObject = {};
        if (response.statusCode >= 300) {
            const bytes = await collectBody(response.body, context);
            if (bytes.byteLength > 0) {
                Object.assign(dataObject, await deserializer.read(15, bytes));
            }
            await this.handleError(operationSchema, context, response, dataObject, this.deserializeMetadata(response));
            throw new Error("@smithy/core/protocols - RPC Protocol error handler failed to throw.");
        }
        for (const header in response.headers) {
            const value = response.headers[header];
            delete response.headers[header];
            response.headers[header.toLowerCase()] = value;
        }
        const eventStreamMember = ns.getEventStreamMember();
        if (eventStreamMember) {
            dataObject[eventStreamMember] = await this.deserializeEventStream({
                response,
                responseSchema: ns,
                initialResponseContainer: dataObject,
            });
        }
        else {
            const bytes = await collectBody(response.body, context);
            if (bytes.byteLength > 0) {
                Object.assign(dataObject, await deserializer.read(ns, bytes));
            }
        }
        dataObject.$metadata = this.deserializeMetadata(response);
        return dataObject;
    }
}

const resolvedPath = (resolvedPath, input, memberName, labelValueProvider, uriLabel, isGreedyLabel) => {
    if (input != null && input[memberName] !== undefined) {
        const labelValue = labelValueProvider();
        if (labelValue == null || labelValue.length <= 0) {
            throw new Error("Empty value provided for input HTTP label: " + memberName + ".");
        }
        resolvedPath = resolvedPath.replace(uriLabel, isGreedyLabel
            ? labelValue
                .split("/")
                .map((segment) => extendedEncodeURIComponent(segment))
                .join("/")
            : extendedEncodeURIComponent(labelValue));
    }
    else {
        throw new Error("No value provided for input HTTP label: " + memberName + ".");
    }
    return resolvedPath;
};

function requestBuilder(input, context) {
    return new RequestBuilder(input, context);
}
class RequestBuilder {
    input;
    context;
    query = {};
    method = "";
    headers = {};
    path = "";
    body = null;
    hostname = "";
    resolvePathStack = [];
    constructor(input, context) {
        this.input = input;
        this.context = context;
    }
    async build() {
        const { hostname, protocol = "https", port, path: basePath } = await this.context.endpoint();
        this.path = basePath;
        for (const resolvePath of this.resolvePathStack) {
            resolvePath(this.path);
        }
        return new HttpRequest({
            protocol,
            hostname: this.hostname || hostname,
            port,
            method: this.method,
            path: this.path,
            query: this.query,
            body: this.body,
            headers: this.headers,
        });
    }
    hn(hostname) {
        this.hostname = hostname;
        return this;
    }
    bp(uriLabel) {
        this.resolvePathStack.push((basePath) => {
            this.path = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + uriLabel;
        });
        return this;
    }
    p(memberName, labelValueProvider, uriLabel, isGreedyLabel) {
        this.resolvePathStack.push((path) => {
            this.path = resolvedPath(path, this.input, memberName, labelValueProvider, uriLabel, isGreedyLabel);
        });
        return this;
    }
    h(headers) {
        this.headers = headers;
        return this;
    }
    q(query) {
        this.query = query;
        return this;
    }
    b(body) {
        this.body = body;
        return this;
    }
    m(method) {
        this.method = method;
        return this;
    }
}

function determineTimestampFormat(ns, settings) {
    if (settings.timestampFormat.useTrait) {
        if (ns.isTimestampSchema() &&
            (ns.getSchema() === 5 ||
                ns.getSchema() === 6 ||
                ns.getSchema() === 7)) {
            return ns.getSchema();
        }
    }
    const { httpLabel, httpPrefixHeaders, httpHeader, httpQuery } = ns.getMergedTraits();
    const bindingFormat = settings.httpBindings
        ? typeof httpPrefixHeaders === "string" || Boolean(httpHeader)
            ? 6
            : Boolean(httpQuery) || Boolean(httpLabel)
                ? 5
                : undefined
        : undefined;
    return bindingFormat ?? settings.timestampFormat.default;
}

class FromStringShapeDeserializer extends SerdeContext {
    settings;
    constructor(settings) {
        super();
        this.settings = settings;
    }
    read(_schema, data) {
        const ns = NormalizedSchema.of(_schema);
        if (ns.isListSchema()) {
            return splitHeader(data).map((item) => this.read(ns.getValueSchema(), item));
        }
        if (ns.isBlobSchema()) {
            return (this.serdeContext?.base64Decoder ?? fromBase64)(data);
        }
        if (ns.isTimestampSchema()) {
            const format = determineTimestampFormat(ns, this.settings);
            switch (format) {
                case 5:
                    return _parseRfc3339DateTimeWithOffset(data);
                case 6:
                    return _parseRfc7231DateTime(data);
                case 7:
                    return _parseEpochTimestamp(data);
                default:
                    console.warn("Missing timestamp format, parsing value with Date constructor:", data);
                    return new Date(data);
            }
        }
        if (ns.isStringSchema()) {
            const mediaType = ns.getMergedTraits().mediaType;
            let intermediateValue = data;
            if (mediaType) {
                if (ns.getMergedTraits().httpHeader) {
                    intermediateValue = this.base64ToUtf8(intermediateValue);
                }
                const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
                if (isJson) {
                    intermediateValue = LazyJsonString.from(intermediateValue);
                }
                return intermediateValue;
            }
        }
        if (ns.isNumericSchema()) {
            return Number(data);
        }
        if (ns.isBigIntegerSchema()) {
            return BigInt(data);
        }
        if (ns.isBigDecimalSchema()) {
            return new NumericValue(data, "bigDecimal");
        }
        if (ns.isBooleanSchema()) {
            return String(data).toLowerCase() === "true";
        }
        return data;
    }
    base64ToUtf8(base64String) {
        return (this.serdeContext?.utf8Encoder ?? toUtf8)((this.serdeContext?.base64Decoder ?? fromBase64)(base64String));
    }
}

class HttpInterceptingShapeDeserializer extends SerdeContext {
    codecDeserializer;
    stringDeserializer;
    constructor(codecDeserializer, codecSettings) {
        super();
        this.codecDeserializer = codecDeserializer;
        this.stringDeserializer = new FromStringShapeDeserializer(codecSettings);
    }
    setSerdeContext(serdeContext) {
        this.stringDeserializer.setSerdeContext(serdeContext);
        this.codecDeserializer.setSerdeContext(serdeContext);
        this.serdeContext = serdeContext;
    }
    read(schema, data) {
        const ns = NormalizedSchema.of(schema);
        const traits = ns.getMergedTraits();
        const toString = this.serdeContext?.utf8Encoder ?? toUtf8;
        if (traits.httpHeader || traits.httpResponseCode) {
            return this.stringDeserializer.read(ns, toString(data));
        }
        if (traits.httpPayload) {
            if (ns.isBlobSchema()) {
                const toBytes = this.serdeContext?.utf8Decoder ?? fromUtf8;
                if (typeof data === "string") {
                    return toBytes(data);
                }
                return data;
            }
            else if (ns.isStringSchema()) {
                if ("byteLength" in data) {
                    return toString(data);
                }
                return data;
            }
        }
        return this.codecDeserializer.read(ns, data);
    }
}

class ToStringShapeSerializer extends SerdeContext {
    settings;
    stringBuffer = "";
    constructor(settings) {
        super();
        this.settings = settings;
    }
    write(schema, value) {
        const ns = NormalizedSchema.of(schema);
        switch (typeof value) {
            case "object":
                if (value === null) {
                    this.stringBuffer = "null";
                    return;
                }
                if (ns.isTimestampSchema()) {
                    if (!(value instanceof Date)) {
                        throw new Error(`@smithy/core/protocols - received non-Date value ${value} when schema expected Date in ${ns.getName(true)}`);
                    }
                    const format = determineTimestampFormat(ns, this.settings);
                    switch (format) {
                        case 5:
                            this.stringBuffer = value.toISOString().replace(".000Z", "Z");
                            break;
                        case 6:
                            this.stringBuffer = dateToUtcString(value);
                            break;
                        case 7:
                            this.stringBuffer = String(value.getTime() / 1000);
                            break;
                        default:
                            console.warn("Missing timestamp format, using epoch seconds", value);
                            this.stringBuffer = String(value.getTime() / 1000);
                    }
                    return;
                }
                if (ns.isBlobSchema() && "byteLength" in value) {
                    this.stringBuffer = (this.serdeContext?.base64Encoder ?? toBase64)(value);
                    return;
                }
                if (ns.isListSchema() && Array.isArray(value)) {
                    let buffer = "";
                    for (const item of value) {
                        this.write([ns.getValueSchema(), ns.getMergedTraits()], item);
                        const headerItem = this.flush();
                        const serialized = ns.getValueSchema().isTimestampSchema() ? headerItem : quoteHeader(headerItem);
                        if (buffer !== "") {
                            buffer += ", ";
                        }
                        buffer += serialized;
                    }
                    this.stringBuffer = buffer;
                    return;
                }
                this.stringBuffer = JSON.stringify(value, null, 2);
                break;
            case "string":
                const mediaType = ns.getMergedTraits().mediaType;
                let intermediateValue = value;
                if (mediaType) {
                    const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
                    if (isJson) {
                        intermediateValue = LazyJsonString.from(intermediateValue);
                    }
                    if (ns.getMergedTraits().httpHeader) {
                        this.stringBuffer = (this.serdeContext?.base64Encoder ?? toBase64)(intermediateValue.toString());
                        return;
                    }
                }
                this.stringBuffer = value;
                break;
            default:
                if (ns.isIdempotencyToken()) {
                    this.stringBuffer = generateIdempotencyToken();
                }
                else {
                    this.stringBuffer = String(value);
                }
        }
    }
    flush() {
        const buffer = this.stringBuffer;
        this.stringBuffer = "";
        return buffer;
    }
}

class HttpInterceptingShapeSerializer {
    codecSerializer;
    stringSerializer;
    buffer;
    constructor(codecSerializer, codecSettings, stringSerializer = new ToStringShapeSerializer(codecSettings)) {
        this.codecSerializer = codecSerializer;
        this.stringSerializer = stringSerializer;
    }
    setSerdeContext(serdeContext) {
        this.codecSerializer.setSerdeContext(serdeContext);
        this.stringSerializer.setSerdeContext(serdeContext);
    }
    write(schema, value) {
        const ns = NormalizedSchema.of(schema);
        const traits = ns.getMergedTraits();
        if (traits.httpHeader || traits.httpLabel || traits.httpQuery) {
            this.stringSerializer.write(ns, value);
            this.buffer = this.stringSerializer.flush();
            return;
        }
        return this.codecSerializer.write(ns, value);
    }
    flush() {
        if (this.buffer !== undefined) {
            const buffer = this.buffer;
            this.buffer = undefined;
            return buffer;
        }
        return this.codecSerializer.flush();
    }
}

class Field {
    name;
    kind;
    values;
    constructor({ name, kind = FieldPosition.HEADER, values = [] }) {
        this.name = name;
        this.kind = kind;
        this.values = values;
    }
    add(value) {
        this.values.push(value);
    }
    set(values) {
        this.values = values;
    }
    remove(value) {
        this.values = this.values.filter((v) => v !== value);
    }
    toString() {
        return this.values.map((v) => (v.includes(",") || v.includes(" ") ? `"${v}"` : v)).join(", ");
    }
    get() {
        return this.values;
    }
}

class Fields {
    entries = {};
    encoding;
    constructor({ fields = [], encoding = "utf-8" }) {
        fields.forEach(this.setField.bind(this));
        this.encoding = encoding;
    }
    setField(field) {
        this.entries[field.name.toLowerCase()] = field;
    }
    getField(name) {
        return this.entries[name.toLowerCase()];
    }
    removeField(name) {
        delete this.entries[name.toLowerCase()];
    }
    getByType(kind) {
        return Object.values(this.entries).filter((field) => field.kind === kind);
    }
}

const getHttpHandlerExtensionConfiguration = (runtimeConfig) => {
    if (runtimeConfig.logger && runtimeConfig.logger.constructor?.name !== "NoOpLogger") {
        runtimeConfig.requestHandler?.updateHttpClientConfig?.(Symbol.for("logger"), runtimeConfig.logger);
    }
    return {
        setHttpHandler(handler) {
            runtimeConfig.requestHandler = handler;
        },
        httpHandler() {
            return runtimeConfig.requestHandler;
        },
        updateHttpClientConfig(key, value) {
            runtimeConfig.requestHandler?.updateHttpClientConfig(key, value);
        },
        httpHandlerConfigs() {
            return runtimeConfig.requestHandler.httpHandlerConfigs();
        },
    };
};
const resolveHttpHandlerRuntimeConfig = (httpHandlerExtensionConfiguration) => {
    return {
        requestHandler: httpHandlerExtensionConfiguration.httpHandler(),
    };
};

const CONTENT_LENGTH_HEADER = "content-length";
function contentLengthMiddleware(bodyLengthChecker) {
    return (next) => async (args) => {
        const request = args.request;
        if (HttpRequest.isInstance(request)) {
            const { body, headers } = request;
            if (body &&
                Object.keys(headers)
                    .map((str) => str.toLowerCase())
                    .indexOf(CONTENT_LENGTH_HEADER) === -1) {
                try {
                    const length = bodyLengthChecker(body);
                    if (length != null) {
                        request.headers = {
                            ...request.headers,
                            [CONTENT_LENGTH_HEADER]: String(length),
                        };
                    }
                }
                catch (ignored) {
                }
            }
        }
        return next({
            ...args,
            request,
        });
    };
}
const contentLengthMiddlewareOptions = {
    step: "build",
    tags: ["SET_CONTENT_LENGTH", "CONTENT_LENGTH"],
    name: "contentLengthMiddleware",
    override: true,
};
const getContentLengthPlugin = (options) => ({
    applyToStack: (clientStack) => {
        clientStack.add(contentLengthMiddleware(options.bodyLengthChecker), contentLengthMiddlewareOptions);
    },
});

const escapeUri = (uri) => encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode);
const hexEncode = (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`;

const escapeUriPath = (uri) => uri.split("/").map(escapeUri).join("/");

function buildQueryString(query) {
    const parts = [];
    for (let key of Object.keys(query).sort()) {
        const value = query[key];
        key = escapeUri(key);
        if (Array.isArray(value)) {
            for (let i = 0, iLen = value.length; i < iLen; i++) {
                parts.push(`${key}=${escapeUri(value[i])}`);
            }
        }
        else {
            let qsEntry = key;
            if (value || typeof value === "string") {
                qsEntry += `=${escapeUri(value)}`;
            }
            parts.push(qsEntry);
        }
    }
    return parts.join("&");
}

exports.Field = Field;
exports.Fields = Fields;
exports.FromStringShapeDeserializer = FromStringShapeDeserializer;
exports.HttpBindingProtocol = HttpBindingProtocol;
exports.HttpInterceptingShapeDeserializer = HttpInterceptingShapeDeserializer;
exports.HttpInterceptingShapeSerializer = HttpInterceptingShapeSerializer;
exports.HttpProtocol = HttpProtocol;
exports.RequestBuilder = RequestBuilder;
exports.RpcProtocol = RpcProtocol;
exports.SerdeContext = SerdeContext;
exports.ToStringShapeSerializer = ToStringShapeSerializer;
exports.buildQueryString = buildQueryString;
exports.collectBody = collectBody;
exports.contentLengthMiddleware = contentLengthMiddleware;
exports.contentLengthMiddlewareOptions = contentLengthMiddlewareOptions;
exports.determineTimestampFormat = determineTimestampFormat;
exports.escapeUri = escapeUri;
exports.escapeUriPath = escapeUriPath;
exports.extendedEncodeURIComponent = extendedEncodeURIComponent;
exports.getContentLengthPlugin = getContentLengthPlugin;
exports.getHttpHandlerExtensionConfiguration = getHttpHandlerExtensionConfiguration;
exports.requestBuilder = requestBuilder;
exports.resolveHttpHandlerRuntimeConfig = resolveHttpHandlerRuntimeConfig;
exports.resolvedPath = resolvedPath;
