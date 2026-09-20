// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../../core/resource.mjs";
import { PageCursor } from "../../../../core/pagination.mjs";
import { path } from "../../../../internal/utils/path.mjs";
export class RateLimits extends APIResource {
    /**
     * List rate-limit overrides configured for a workspace.
     *
     * Returns only the groups and limiter types that have a workspace-level override.
     * Groups without overrides inherit the organization limits and are not listed; use
     * `GET /v1/organizations/rate_limits` to see those.
     *
     * When `limit` is omitted, every matching entry is returned in a single page; when
     * `limit` truncates the result, follow `next_page` to fetch the remaining entries.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaWorkspaceRateLimit of client.beta.organization.workspaces.rateLimits.list(
     *   'workspace_id',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(workspaceID, query = {}, options) {
        return this._client.getAPIList(path `/v1/organizations/workspaces/${workspaceID}/rate_limits?beta=true`, (PageCursor), { query, ...options });
    }
}
//# sourceMappingURL=rate-limits.mjs.map