// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../core/resource.mjs";
import { PageCursor } from "../../core/pagination.mjs";
import { buildHeaders } from "../../internal/headers.mjs";
import { path } from "../../internal/utils/path.mjs";
export class DeploymentRuns extends APIResource {
    /**
     * Get Deployment Run
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeploymentRun =
     *   await client.beta.deploymentRuns.retrieve(
     *     'deployment_run_id',
     *   );
     * ```
     */
    retrieve(deploymentRunID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path `/v1/deployment_runs/${deploymentRunID}?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List Deployment Runs
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsDeploymentRun of client.beta.deploymentRuns.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/deployment_runs?beta=true', (PageCursor), {
            query,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
}
//# sourceMappingURL=deployment-runs.mjs.map