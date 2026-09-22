// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../core/resource.mjs";
import * as WorkAPI from "./work.mjs";
import { Work, } from "./work.mjs";
import { PageCursor } from "../../../core/pagination.mjs";
import { buildHeaders } from "../../../internal/headers.mjs";
import { path } from "../../../internal/utils/path.mjs";
export class Environments extends APIResource {
    constructor() {
        super(...arguments);
        this.work = new WorkAPI.Work(this._client);
    }
    /**
     * Create a new environment with the specified configuration.
     *
     * @example
     * ```ts
     * const betaEnvironment =
     *   await client.beta.environments.create({
     *     name: 'python-data-analysis',
     *   });
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/environments?beta=true', {
            body,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Retrieve a specific environment by ID.
     *
     * @example
     * ```ts
     * const betaEnvironment =
     *   await client.beta.environments.retrieve(
     *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   );
     * ```
     */
    retrieve(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path `/v1/environments/${environmentID}?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Update an existing environment's configuration.
     *
     * @example
     * ```ts
     * const betaEnvironment =
     *   await client.beta.environments.update(
     *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   );
     * ```
     */
    update(environmentID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path `/v1/environments/${environmentID}?beta=true`, {
            body,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List environments with pagination support.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaEnvironment of client.beta.environments.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/environments?beta=true', (PageCursor), {
            query,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Delete an environment by ID. Returns a confirmation of the deletion.
     *
     * @example
     * ```ts
     * const betaEnvironmentDeleteResponse =
     *   await client.beta.environments.delete(
     *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   );
     * ```
     */
    delete(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path `/v1/environments/${environmentID}?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Archive an environment by ID. Archived environments cannot be used to create new
     * sessions.
     *
     * @example
     * ```ts
     * const betaEnvironment =
     *   await client.beta.environments.archive(
     *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
     *   );
     * ```
     */
    archive(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path `/v1/environments/${environmentID}/archive?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
}
Environments.Work = Work;
//# sourceMappingURL=environments.mjs.map