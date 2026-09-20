"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Threads = void 0;
const tslib_1 = require("../../../../internal/tslib.js");
const resource_1 = require("../../../../core/resource.js");
const ThreadsEventsAPI = tslib_1.__importStar(require("./events.js"));
const events_1 = require("./events.js");
const pagination_1 = require("../../../../core/pagination.js");
const headers_1 = require("../../../../internal/headers.js");
const path_1 = require("../../../../internal/utils/path.js");
class Threads extends resource_1.APIResource {
    constructor() {
        super(...arguments);
        this.events = new ThreadsEventsAPI.Events(this._client);
    }
    /**
     * Get Session Thread
     *
     * @example
     * ```ts
     * const betaManagedAgentsSessionThread =
     *   await client.beta.sessions.threads.retrieve(
     *     'sthr_011CZkZVWa6oIjw0rgXZpnBt',
     *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
     *   );
     * ```
     */
    retrieve(threadID, params, options) {
        const { session_id, betas } = params;
        return this._client.get((0, path_1.path) `/v1/sessions/${session_id}/threads/${threadID}?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List Session Threads
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsSessionThread of client.beta.sessions.threads.list(
     *   'sesn_011CZkZAtmR3yMPDzynEDxu7',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(sessionID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList((0, path_1.path) `/v1/sessions/${sessionID}/threads?beta=true`, (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Archive Session Thread
     *
     * @example
     * ```ts
     * const betaManagedAgentsSessionThread =
     *   await client.beta.sessions.threads.archive(
     *     'sthr_011CZkZVWa6oIjw0rgXZpnBt',
     *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
     *   );
     * ```
     */
    archive(threadID, params, options) {
        const { session_id, betas } = params;
        return this._client.post((0, path_1.path) `/v1/sessions/${session_id}/threads/${threadID}/archive?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
}
exports.Threads = Threads;
Threads.Events = events_1.Events;
//# sourceMappingURL=threads.js.map