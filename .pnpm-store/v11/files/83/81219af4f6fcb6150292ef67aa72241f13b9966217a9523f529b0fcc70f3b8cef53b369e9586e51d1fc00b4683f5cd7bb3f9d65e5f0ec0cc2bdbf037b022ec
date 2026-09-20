"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentWorker = exports.WorkPoller = exports.Work = void 0;
const resource_1 = require("../../../core/resource.js");
const pagination_1 = require("../../../core/pagination.js");
const headers_1 = require("../../../internal/headers.js");
const path_1 = require("../../../internal/utils/path.js");
const poller_1 = require("../../../lib/environments/poller.js");
const worker_1 = require("../../../lib/environments/worker.js");
class Work extends resource_1.APIResource {
    /**
     * Note: these endpoints are called automatically by the pre-built environment
     * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
     * sandbox environments. They are included here as a reference; you do not need to
     * invoke them directly.
     *
     * Retrieve detailed information about a specific work item.
     *
     * @example
     * ```ts
     * const betaSelfHostedWork =
     *   await client.beta.environments.work.retrieve('work_id', {
     *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   });
     * ```
     */
    retrieve(workID, params, options) {
        const { environment_id, betas } = params;
        return this._client.get((0, path_1.path) `/v1/environments/${environment_id}/work/${workID}?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Note: these endpoints are called automatically by the pre-built environment
     * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
     * sandbox environments. They are included here as a reference; you do not need to
     * invoke them directly.
     *
     * Update work item metadata with merge semantics.
     *
     * @example
     * ```ts
     * const betaSelfHostedWork =
     *   await client.beta.environments.work.update('work_id', {
     *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *     metadata: { foo: 'string' },
     *   });
     * ```
     */
    update(workID, params, options) {
        const { environment_id, betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/environments/${environment_id}/work/${workID}?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Note: these endpoints are called automatically by the pre-built environment
     * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
     * sandbox environments. They are included here as a reference; you do not need to
     * invoke them directly.
     *
     * List work items in an environment.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaSelfHostedWork of client.beta.environments.work.list(
     *   'env_011CZkZ9X2dpNyB7HsEFoRfW',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(environmentID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList((0, path_1.path) `/v1/environments/${environmentID}/work?beta=true`, (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Note: these endpoints are called automatically by the pre-built environment
     * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
     * sandbox environments. They are included here as a reference; you do not need to
     * invoke them directly.
     *
     * Acknowledge receipt of a work item, transitioning it from 'queued' to 'starting'
     * and removing it from the queue.
     *
     * @example
     * ```ts
     * const betaSelfHostedWork =
     *   await client.beta.environments.work.ack('work_id', {
     *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   });
     * ```
     */
    ack(workID, params, options) {
        const { environment_id, betas } = params;
        return this._client.post((0, path_1.path) `/v1/environments/${environment_id}/work/${workID}/ack?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Note: these endpoints are called automatically by the pre-built environment
     * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
     * sandbox environments. They are included here as a reference; you do not need to
     * invoke them directly.
     *
     * Record a heartbeat for a work item to maintain the lease.
     *
     * @example
     * ```ts
     * const betaSelfHostedWorkHeartbeatResponse =
     *   await client.beta.environments.work.heartbeat('work_id', {
     *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   });
     * ```
     */
    heartbeat(workID, params, options) {
        const { environment_id, desired_ttl_seconds, expected_last_heartbeat, betas } = params;
        return this._client.post((0, path_1.path) `/v1/environments/${environment_id}/work/${workID}/heartbeat?beta=true`, {
            query: { desired_ttl_seconds, expected_last_heartbeat },
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Note: these endpoints are called automatically by the pre-built environment
     * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
     * sandbox environments. They are included here as a reference; you do not need to
     * invoke them directly.
     *
     * Long poll for work items in the queue.
     *
     * @example
     * ```ts
     * const betaSelfHostedWork =
     *   await client.beta.environments.work.poll(
     *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   );
     * ```
     */
    poll(environmentID, params = {}, options) {
        const { betas, 'Anthropic-Worker-ID': anthropicWorkerID, ...query } = params ?? {};
        return this._client.get((0, path_1.path) `/v1/environments/${environmentID}/work/poll?beta=true`, {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                {
                    'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString(),
                    ...(anthropicWorkerID != null ? { 'Anthropic-Worker-ID': anthropicWorkerID } : undefined),
                },
                options?.headers,
            ]),
        });
    }
    /**
     * Get statistics about the work queue for an environment.
     *
     * @example
     * ```ts
     * const betaSelfHostedWorkQueueStats =
     *   await client.beta.environments.work.stats(
     *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   );
     * ```
     */
    stats(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path) `/v1/environments/${environmentID}/work/stats?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Note: these endpoints are called automatically by the pre-built environment
     * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
     * sandbox environments. They are included here as a reference; you do not need to
     * invoke them directly.
     *
     * Stop a work item, initiating graceful or forced shutdown.
     *
     * @example
     * ```ts
     * const betaSelfHostedWork =
     *   await client.beta.environments.work.stop('work_id', {
     *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   });
     * ```
     */
    stop(workID, params, options) {
        const { environment_id, betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/environments/${environment_id}/work/${workID}/stop?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Continuously claim work from a self-hosted environment, ack each item,
     * and yield it. Posts `stop` automatically when the consumer's loop body
     * returns or when iteration ends.
     *
     * @example
     * ```ts
     * for await (const work of client.beta.environments.work.poller({
     *   environmentId,
     *   environmentKey,
     * })) {
     *   if (work.data.type !== 'session') continue;
     *   // ...service the work...
     * }
     * ```
     */
    poller(opts) {
        return new poller_1.WorkPoller({ ...opts, client: this._client });
    }
    worker(opts) {
        return new worker_1.EnvironmentWorker({ ...opts, client: this._client });
    }
}
exports.Work = Work;
var poller_2 = require("../../../lib/environments/poller.js");
Object.defineProperty(exports, "WorkPoller", { enumerable: true, get: function () { return poller_2.WorkPoller; } });
var worker_2 = require("../../../lib/environments/worker.js");
Object.defineProperty(exports, "EnvironmentWorker", { enumerable: true, get: function () { return worker_2.EnvironmentWorker; } });
Work.WorkPoller = poller_1.WorkPoller;
Work.EnvironmentWorker = worker_1.EnvironmentWorker;
//# sourceMappingURL=work.js.map