"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
const resource_1 = require("../../../../core/resource.js");
const pagination_1 = require("../../../../core/pagination.js");
const headers_1 = require("../../../../internal/headers.js");
const path_1 = require("../../../../internal/utils/path.js");
class Events extends resource_1.APIResource {
    /**
     * List Session Thread Events
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsSessionEvent of client.beta.sessions.threads.events.list(
     *   'sthr_011CZkZVWa6oIjw0rgXZpnBt',
     *   { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
     * )) {
     *   // ...
     * }
     * ```
     */
    list(threadID, params, options) {
        const { session_id, betas, ...query } = params;
        return this._client.getAPIList((0, path_1.path) `/v1/sessions/${session_id}/threads/${threadID}/events?beta=true`, (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Stream Session Thread Events
     *
     * @example
     * ```ts
     * const betaManagedAgentsStreamSessionThreadEvents =
     *   await client.beta.sessions.threads.events.stream(
     *     'sthr_011CZkZVWa6oIjw0rgXZpnBt',
     *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
     *   );
     * ```
     */
    stream(threadID, params, options) {
        const { session_id, betas, ...query } = params;
        return this._client.get((0, path_1.path) `/v1/sessions/${session_id}/threads/${threadID}/stream?beta=true`, {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
            stream: true,
        });
    }
}
exports.Events = Events;
//# sourceMappingURL=events.js.map