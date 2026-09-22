// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../../core/resource.mjs";
import * as ThreadsEventsAPI from "./events.mjs";
import { Events } from "./events.mjs";
import { PageCursor } from "../../../../core/pagination.mjs";
import { buildHeaders } from "../../../../internal/headers.mjs";
import { path } from "../../../../internal/utils/path.mjs";
export class Threads extends APIResource {
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
        return this._client.get(path `/v1/sessions/${session_id}/threads/${threadID}?beta=true`, {
            ...options,
            headers: buildHeaders([
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
        return this._client.getAPIList(path `/v1/sessions/${sessionID}/threads?beta=true`, (PageCursor), {
            query,
            ...options,
            headers: buildHeaders([
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
        return this._client.post(path `/v1/sessions/${session_id}/threads/${threadID}/archive?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
}
Threads.Events = Events;
//# sourceMappingURL=threads.mjs.map