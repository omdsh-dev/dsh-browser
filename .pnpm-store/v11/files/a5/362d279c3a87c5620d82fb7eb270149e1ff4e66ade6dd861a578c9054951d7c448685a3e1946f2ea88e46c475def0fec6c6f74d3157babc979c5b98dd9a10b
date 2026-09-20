"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agents = void 0;
const tslib_1 = require("../../../internal/tslib.js");
const resource_1 = require("../../../core/resource.js");
const VersionsAPI = tslib_1.__importStar(require("./versions.js"));
const versions_1 = require("./versions.js");
const pagination_1 = require("../../../core/pagination.js");
const headers_1 = require("../../../internal/headers.js");
const path_1 = require("../../../internal/utils/path.js");
class Agents extends resource_1.APIResource {
    constructor() {
        super(...arguments);
        this.versions = new VersionsAPI.Versions(this._client);
    }
    /**
     * Create Agent
     *
     * @example
     * ```ts
     * const betaManagedAgentsAgent =
     *   await client.beta.agents.create({
     *     model: 'claude-opus-5',
     *     name: 'My First Agent',
     *   });
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/agents?beta=true', {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Get Agent
     *
     * @example
     * ```ts
     * const betaManagedAgentsAgent =
     *   await client.beta.agents.retrieve(
     *     'agent_011CZkYpogX7uDKUyvBTophP',
     *   );
     * ```
     */
    retrieve(agentID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.get((0, path_1.path) `/v1/agents/${agentID}?beta=true`, {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Update Agent
     *
     * @example
     * ```ts
     * const betaManagedAgentsAgent =
     *   await client.beta.agents.update(
     *     'agent_011CZkYpogX7uDKUyvBTophP',
     *     { description: 'updated' },
     *   );
     * ```
     */
    update(agentID, params, options) {
        const { betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/agents/${agentID}?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List Agents
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsAgent of client.beta.agents.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/agents?beta=true', (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Archive Agent
     *
     * @example
     * ```ts
     * const betaManagedAgentsAgent =
     *   await client.beta.agents.archive(
     *     'agent_011CZkYpogX7uDKUyvBTophP',
     *   );
     * ```
     */
    archive(agentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/agents/${agentID}/archive?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
}
exports.Agents = Agents;
Agents.Versions = versions_1.Versions;
//# sourceMappingURL=agents.js.map