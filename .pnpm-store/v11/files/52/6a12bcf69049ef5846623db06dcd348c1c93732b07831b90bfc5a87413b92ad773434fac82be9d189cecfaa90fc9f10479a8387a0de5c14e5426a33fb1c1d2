// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../core/resource.mjs";
import * as EventsAPI from "./events.mjs";
import { Events, } from "./events.mjs";
import * as ResourcesAPI from "./resources.mjs";
import { Resources, } from "./resources.mjs";
import * as ThreadsAPI from "./threads/threads.mjs";
import { Threads, } from "./threads/threads.mjs";
import { BidirectionalPageCursor, } from "../../../core/pagination.mjs";
import { buildHeaders } from "../../../internal/headers.mjs";
import { path } from "../../../internal/utils/path.mjs";
export class Sessions extends APIResource {
    constructor() {
        super(...arguments);
        this.events = new EventsAPI.Events(this._client);
        this.resources = new ResourcesAPI.Resources(this._client);
        this.threads = new ThreadsAPI.Threads(this._client);
    }
    /**
     * Create Session
     *
     * @example
     * ```ts
     * const betaManagedAgentsSession =
     *   await client.beta.sessions.create({
     *     agent: 'agent_011CZkYpogX7uDKUyvBTophP',
     *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   });
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/sessions?beta=true', {
            body,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Get Session
     *
     * @example
     * ```ts
     * const betaManagedAgentsSession =
     *   await client.beta.sessions.retrieve(
     *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
     *   );
     * ```
     */
    retrieve(sessionID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path `/v1/sessions/${sessionID}?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Update Session
     *
     * @example
     * ```ts
     * const betaManagedAgentsSession =
     *   await client.beta.sessions.update(
     *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
     *   );
     * ```
     */
    update(sessionID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path `/v1/sessions/${sessionID}?beta=true`, {
            body,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List Sessions
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsSession of client.beta.sessions.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/sessions?beta=true', (BidirectionalPageCursor), {
            query,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Delete Session
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeletedSession =
     *   await client.beta.sessions.delete(
     *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
     *   );
     * ```
     */
    delete(sessionID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path `/v1/sessions/${sessionID}?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Archive Session
     *
     * @example
     * ```ts
     * const betaManagedAgentsSession =
     *   await client.beta.sessions.archive(
     *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
     *   );
     * ```
     */
    archive(sessionID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path `/v1/sessions/${sessionID}/archive?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
}
Sessions.Events = Events;
Sessions.Resources = Resources;
Sessions.Threads = Threads;
//# sourceMappingURL=sessions.mjs.map