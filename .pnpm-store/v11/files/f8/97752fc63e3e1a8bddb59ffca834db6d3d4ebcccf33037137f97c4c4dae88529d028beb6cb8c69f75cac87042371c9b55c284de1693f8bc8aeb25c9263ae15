const { SMITHY_CONTEXT_KEY } = require("@smithy/types");

const getSmithyContext = (context) => context[SMITHY_CONTEXT_KEY] || (context[SMITHY_CONTEXT_KEY] = {});

class HttpRequest {
    method;
    protocol;
    hostname;
    port;
    path;
    query;
    headers;
    username;
    password;
    fragment;
    body;
    constructor(options) {
        this.method = options.method || "GET";
        this.hostname = options.hostname || "localhost";
        this.port = options.port;
        this.query = options.query || {};
        this.headers = options.headers || {};
        this.body = options.body;
        this.protocol = options.protocol
            ? options.protocol.slice(-1) !== ":"
                ? `${options.protocol}:`
                : options.protocol
            : "https:";
        this.path = options.path ? (options.path.charAt(0) !== "/" ? `/${options.path}` : options.path) : "/";
        this.username = options.username;
        this.password = options.password;
        this.fragment = options.fragment;
    }
    static clone(request) {
        const cloned = new HttpRequest({
            ...request,
            headers: { ...request.headers },
        });
        if (cloned.query) {
            cloned.query = cloneQuery(cloned.query);
        }
        return cloned;
    }
    static isInstance(request) {
        if (!request) {
            return false;
        }
        const req = request;
        return ("method" in req &&
            "protocol" in req &&
            "hostname" in req &&
            "path" in req &&
            typeof req["query"] === "object" &&
            typeof req["headers"] === "object");
    }
    clone() {
        return HttpRequest.clone(this);
    }
}
function cloneQuery(query) {
    return Object.keys(query).reduce((carry, paramName) => {
        const param = query[paramName];
        return {
            ...carry,
            [paramName]: Array.isArray(param) ? [...param] : param,
        };
    }, {});
}

class HttpResponse {
    statusCode;
    reason;
    headers;
    body;
    constructor(options) {
        this.statusCode = options.statusCode;
        this.reason = options.reason;
        this.headers = options.headers || {};
        this.body = options.body;
    }
    static isInstance(response) {
        if (!response)
            return false;
        const resp = response;
        return typeof resp.statusCode === "number" && typeof resp.headers === "object";
    }
}

const VALID_HOST_LABEL_REGEX = new RegExp(`^(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$`);
const isValidHostLabel = (value, allowSubDomains = false) => {
    if (!allowSubDomains) {
        return VALID_HOST_LABEL_REGEX.test(value);
    }
    const labels = value.split(".");
    for (const label of labels) {
        if (!isValidHostLabel(label)) {
            return false;
        }
    }
    return true;
};

function isValidHostname(hostname) {
    const hostPattern = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
    return hostPattern.test(hostname);
}

const normalizeProvider = (input) => {
    if (typeof input === "function")
        return input;
    const promisified = Promise.resolve(input);
    return () => promisified;
};

function parseQueryString(querystring) {
    const query = {};
    querystring = querystring.replace(/^\?/, "");
    if (querystring) {
        for (const pair of querystring.split("&")) {
            let [key, value = null] = pair.split("=");
            key = decodeURIComponent(key);
            if (value) {
                value = decodeURIComponent(value);
            }
            if (!(key in query)) {
                query[key] = value;
            }
            else if (Array.isArray(query[key])) {
                query[key].push(value);
            }
            else {
                query[key] = [query[key], value];
            }
        }
    }
    return query;
}

const parseUrl = (url) => {
    if (typeof url === "string") {
        return parseUrl(new URL(url));
    }
    const { hostname, pathname, port, protocol, search } = url;
    let query;
    if (search) {
        query = parseQueryString(search);
    }
    return {
        hostname,
        port: port ? parseInt(port) : undefined,
        protocol,
        path: pathname,
        query,
    };
};

const toEndpointV1 = (endpoint) => {
    if (typeof endpoint === "object") {
        if ("url" in endpoint) {
            const v1Endpoint = parseUrl(endpoint.url);
            if (endpoint.headers) {
                v1Endpoint.headers = {};
                for (const name in endpoint.headers) {
                    v1Endpoint.headers[name.toLowerCase()] = endpoint.headers[name].join(", ");
                }
            }
            return v1Endpoint;
        }
        return endpoint;
    }
    return parseUrl(endpoint);
};

exports.HttpRequest = HttpRequest;
exports.HttpResponse = HttpResponse;
exports.getSmithyContext = getSmithyContext;
exports.isValidHostLabel = isValidHostLabel;
exports.isValidHostname = isValidHostname;
exports.normalizeProvider = normalizeProvider;
exports.parseQueryString = parseQueryString;
exports.parseUrl = parseUrl;
exports.toEndpointV1 = toEndpointV1;
