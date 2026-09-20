"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionToolRunner = exports.Events = void 0;
const resource_1 = require("../../../core/resource.js");
const pagination_1 = require("../../../core/pagination.js");
const headers_1 = require("../../../internal/headers.js");
const path_1 = require("../../../internal/utils/path.js");
const SessionToolRunner_1 = require("../../../lib/tools/SessionToolRunner.js");
class Events extends resource_1.APIResource {
    /**
     * List Events
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsSessionEvent of client.beta.sessions.events.list(
     *   'sesn_011CZkZAtmR3yMPDzynEDxu7',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(sessionID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList((0, path_1.path) `/v1/sessions/${sessionID}/events?beta=true`, (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Send Events
     *
     * @example
     * ```ts
     * const betaManagedAgentsSendSessionEvents =
     *   await client.beta.sessions.events.send(
     *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
     *     {
     *       events: [
     *         {
     *           content: [
     *             {
     *               text: 'Where is my order #1234?',
     *               type: 'text',
     *             },
     *           ],
     *           type: 'user.message',
     *         },
     *       ],
     *     },
     *   );
     * ```
     */
    send(sessionID, params, options) {
        const { betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/sessions/${sessionID}/events?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Stream Events
     *
     * @example
     * ```ts
     * const betaManagedAgentsStreamSessionEvents =
     *   await client.beta.sessions.events.stream(
     *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
     *   );
     * ```
     */
    stream(sessionID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.get((0, path_1.path) `/v1/sessions/${sessionID}/events/stream?beta=true`, {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
            stream: true,
        });
    }
    /**
     * Attach to a session and dispatch every incoming `agent.tool_use` and
     * `agent.custom_tool_use` event to a local tool registry, sending the matching
     * result back (`user.tool_result` / `user.custom_tool_result`). The
     * sessions-side counterpart to `client.beta.messages.toolRunner`: yields one
     * entry per completed tool call so callers can observe each dispatch (and
     * `break` to abort cleanly).
     *
     * @example
     * ```ts
     * import { betaAgentToolset20260401 } from '@anthropic-ai/sdk/tools/agent-toolset/node';
     *
     * for await (const call of client.beta.sessions.events.toolRunner(work.data.id, {
     *   tools: [...betaAgentToolset20260401({ workdir }), myTool],
     * })) {
     *   console.log(`${call.name} -> ${call.isError ? 'error' : 'ok'}`);
     * }
     * ```
     */
    toolRunner(sessionID, opts) {
        return new SessionToolRunner_1.SessionToolRunner(sessionID, { ...opts, client: this._client });
    }
}
exports.Events = Events;
var SessionToolRunner_2 = require("../../../lib/tools/SessionToolRunner.js");
Object.defineProperty(exports, "SessionToolRunner", { enumerable: true, get: function () { return SessionToolRunner_2.SessionToolRunner; } });
Events.SessionToolRunner = SessionToolRunner_1.SessionToolRunner;
//# sourceMappingURL=events.js.map