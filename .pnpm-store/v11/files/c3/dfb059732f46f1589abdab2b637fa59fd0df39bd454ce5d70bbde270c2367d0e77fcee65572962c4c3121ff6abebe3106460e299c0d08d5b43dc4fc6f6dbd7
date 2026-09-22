import { APIResource } from "../../../core/resource.mjs";
import * as BetaAPI from "../beta.mjs";
import * as AgentsAPI from "./agents.mjs";
import { BetaManagedAgentsAgentsPageCursor } from "./agents.mjs";
import { type PageCursorParams, PagePromise } from "../../../core/pagination.mjs";
import { RequestOptions } from "../../../internal/request-options.mjs";
export declare class Versions extends APIResource {
    /**
     * List Agent Versions
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsAgent of client.beta.agents.versions.list(
     *   'agent_011CZkYpogX7uDKUyvBTophP',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(agentID: string, params?: VersionListParams | null | undefined, options?: RequestOptions): PagePromise<BetaManagedAgentsAgentsPageCursor, AgentsAPI.BetaManagedAgentsAgent>;
}
export interface VersionListParams extends PageCursorParams {
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export declare namespace Versions {
    export { type VersionListParams as VersionListParams };
}
export { type BetaManagedAgentsAgentsPageCursor };
//# sourceMappingURL=versions.d.mts.map