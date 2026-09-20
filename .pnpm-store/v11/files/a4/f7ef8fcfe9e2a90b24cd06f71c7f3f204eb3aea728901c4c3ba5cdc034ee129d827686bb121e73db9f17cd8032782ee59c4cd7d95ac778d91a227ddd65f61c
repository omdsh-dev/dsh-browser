// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { Stream } from "../core/streaming.mjs";
import { formatRequestDetails, loggerFor } from "./utils/log.mjs";
import { releaseRequestSignal } from "./request-signal.mjs";
export async function defaultParseResponse(client, props) {
    const { response, requestLogID, retryOfRequestLogID, startTime } = props;
    const body = await (async () => {
        if (props.options.stream) {
            loggerFor(client).debug('response', response.status, response.url, response.headers, response.body);
            // Note: there is an invariant here that isn't represented in the type system
            // that if you set `stream: true` the response type must also be `Stream<T>`
            return Stream.fromSSEResponse(response, props.controller, client);
        }
        // fetch refuses to read the body when the status code is 204.
        if (response.status === 204) {
            return null;
        }
        if (props.options.__binaryResponse) {
            return response;
        }
        const contentType = response.headers.get('content-type');
        const mediaType = contentType?.split(';')[0]?.trim();
        const isJSON = mediaType?.includes('application/json') || mediaType?.endsWith('+json');
        if (isJSON) {
            const contentLength = response.headers.get('content-length');
            if (contentLength === '0') {
                // if there is no content we can't do anything
                return undefined;
            }
            const json = await response.json();
            return addResponseIDs(json, response);
        }
        const text = await response.text();
        return text;
    })().finally(() => {
        // The body is settled (or parsing threw), so the caller-signal abort
        // listener has nothing left to cancel. Streams release in their own
        // teardown; a raw Response (`__binaryResponse`) keeps the listener so
        // aborting an in-flight download still works.
        if (!props.options.stream && !props.options.__binaryResponse) {
            releaseRequestSignal(props.controller);
        }
    });
    loggerFor(client).debug(`[${requestLogID}] response parsed`, formatRequestDetails({
        retryOfRequestLogID,
        url: response.url,
        status: response.status,
        body,
        durationMs: Date.now() - startTime,
    }));
    return body;
}
export function addResponseIDs(value, response) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value;
    }
    return Object.defineProperties(value, {
        _request_id: { value: response.headers.get('request-id'), enumerable: false },
        _workspace_id: { value: response.headers.get('anthropic-workspace-id'), enumerable: false },
    });
}
//# sourceMappingURL=parse.mjs.map