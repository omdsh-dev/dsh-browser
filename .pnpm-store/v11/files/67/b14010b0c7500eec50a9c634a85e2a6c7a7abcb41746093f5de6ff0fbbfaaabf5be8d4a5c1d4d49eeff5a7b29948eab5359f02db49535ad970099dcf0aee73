"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deployments = void 0;
const resource_1 = require("../../core/resource.js");
const pagination_1 = require("../../core/pagination.js");
const headers_1 = require("../../internal/headers.js");
const path_1 = require("../../internal/utils/path.js");
class Deployments extends resource_1.APIResource {
    /**
     * Create Deployment
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeployment =
     *   await client.beta.deployments.create({
     *     agent: 'string',
     *     environment_id: 'x',
     *     initial_events: [
     *       {
     *         content: [
     *           {
     *             text: 'Where is my order #1234?',
     *             type: 'text',
     *           },
     *         ],
     *         type: 'user.message',
     *       },
     *     ],
     *     name: 'x',
     *   });
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/deployments?beta=true', {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Get Deployment
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeployment =
     *   await client.beta.deployments.retrieve(
     *     'depl_011CZkZcDH3vPqd7xnEfwTai',
     *   );
     * ```
     */
    retrieve(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path) `/v1/deployments/${deploymentID}?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Update Deployment
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeployment =
     *   await client.beta.deployments.update(
     *     'depl_011CZkZcDH3vPqd7xnEfwTai',
     *   );
     * ```
     */
    update(deploymentID, params, options) {
        const { betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/deployments/${deploymentID}?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List Deployments
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsDeployment of client.beta.deployments.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/deployments?beta=true', (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Archive Deployment
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeployment =
     *   await client.beta.deployments.archive(
     *     'depl_011CZkZcDH3vPqd7xnEfwTai',
     *   );
     * ```
     */
    archive(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/deployments/${deploymentID}/archive?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Pause Deployment
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeployment =
     *   await client.beta.deployments.pause(
     *     'depl_011CZkZcDH3vPqd7xnEfwTai',
     *   );
     * ```
     */
    pause(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/deployments/${deploymentID}/pause?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Run Deployment Now
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeploymentRun =
     *   await client.beta.deployments.run(
     *     'depl_011CZkZcDH3vPqd7xnEfwTai',
     *   );
     * ```
     */
    run(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/deployments/${deploymentID}/run?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Unpause Deployment
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeployment =
     *   await client.beta.deployments.unpause(
     *     'depl_011CZkZcDH3vPqd7xnEfwTai',
     *   );
     * ```
     */
    unpause(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/deployments/${deploymentID}/unpause?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
}
exports.Deployments = Deployments;
//# sourceMappingURL=deployments.js.map