import { APIResource } from "../../../core/resource.mjs";
import * as BetaAPI from "../beta.mjs";
import * as VersionsAPI from "./versions.mjs";
import { BetaDeletedSkillVersion, BetaSkillVersion, BetaSkillVersionsPageCursor, VersionCreateParams, VersionDeleteParams, VersionDownloadParams, VersionListParams, VersionRetrieveParams, Versions } from "./versions.mjs";
import { APIPromise } from "../../../core/api-promise.mjs";
import { PageCursor, type PageCursorParams, PagePromise } from "../../../core/pagination.mjs";
import { type Uploadable } from "../../../core/uploads.mjs";
import { RequestOptions } from "../../../internal/request-options.mjs";
export declare class Skills extends APIResource {
    versions: VersionsAPI.Versions;
    /**
     * Create Skill
     *
     * @example
     * ```ts
     * const betaSkill = await client.beta.skills.create({
     *   files: [fs.createReadStream('path/to/file')],
     * });
     * ```
     */
    create(params: SkillCreateParams, options?: RequestOptions): APIPromise<BetaSkill>;
    /**
     * Get Skill
     *
     * @example
     * ```ts
     * const betaSkill = await client.beta.skills.retrieve(
     *   'skill_id',
     * );
     * ```
     */
    retrieve(skillID: string, params?: SkillRetrieveParams | null | undefined, options?: RequestOptions): APIPromise<BetaSkill>;
    /**
     * List Skills
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaSkill of client.beta.skills.list()) {
     *   // ...
     * }
     * ```
     */
    list(params?: SkillListParams | null | undefined, options?: RequestOptions): PagePromise<BetaSkillsPageCursor, BetaSkill>;
    /**
     * Delete Skill
     *
     * @example
     * ```ts
     * const betaDeletedSkill = await client.beta.skills.delete(
     *   'skill_id',
     * );
     * ```
     */
    delete(skillID: string, params?: SkillDeleteParams | null | undefined, options?: RequestOptions): APIPromise<BetaDeletedSkill>;
}
export type BetaSkillsPageCursor = PageCursor<BetaSkill>;
export interface BetaDeletedSkill {
    /**
     * Unique identifier for the skill.
     *
     * The format and length of IDs may change over time.
     */
    id: string;
    /**
     * Deleted object type.
     *
     * For Skills, this is always `"skill_deleted"`.
     */
    type: 'skill_deleted';
}
export interface BetaSkill {
    /**
     * Unique identifier for the skill.
     *
     * The format and length of IDs may change over time.
     */
    id: string;
    /**
     * ISO 8601 timestamp of when the skill was created.
     */
    created_at: string;
    /**
     * Human-readable, single-line label for the Skill. Maximum 255 characters. Always
     * set: derived from the SKILL.md frontmatter `name` when omitted at creation. Not
     * unique.
     */
    display_name: string;
    /**
     * ID of the newest Skill Version — what `latest` references resolve to. Always
     * set: a Skill holds at least one version.
     */
    latest_version_id: string;
    /**
     * Where the Skill comes from.
     *
     * Possible values:
     *
     * - `"custom"`: authored by the platform user; private to their workspace
     * - `"anthropic"`: published by Anthropic; shared and read-only
     * - `"anthropic_example"`: Anthropic-published sample Skill
     * - `"plugin"`: resolved from an installed plugin
     */
    source: BetaSkillSource;
    /**
     * Object type.
     *
     * For Skills, this is always `"skill"`.
     */
    type: 'skill';
    /**
     * ISO 8601 timestamp of when the skill was last updated.
     */
    updated_at: string;
}
export interface BetaSkillSource {
    /**
     * Where the Skill comes from.
     *
     * Possible values:
     *
     * - `"custom"`: authored by the platform user; private to their workspace
     * - `"anthropic"`: published by Anthropic; shared and read-only
     * - `"anthropic_example"`: Anthropic-published sample Skill
     * - `"plugin"`: resolved from an installed plugin
     */
    type: 'custom' | 'anthropic' | 'anthropic_example' | 'plugin';
}
export interface SkillCreateParams {
    /**
     * Body param: Files to upload for the skill.
     *
     * All files must be in the same top-level directory and must include a SKILL.md
     * file at the root of that directory.
     */
    files: Array<Uploadable>;
    /**
     * Body param: Human-readable, single-line label for the Skill. Maximum 255
     * characters. Always set: derived from the SKILL.md frontmatter `name` when
     * omitted at creation. Not unique.
     */
    display_name?: string | null;
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface SkillRetrieveParams {
    /**
     * Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface SkillListParams extends PageCursorParams {
    /**
     * Query param: Filter skills by source.
     *
     * If provided, only skills from the specified source will be returned:
     *
     * - `"custom"`: only return user-created skills
     * - `"anthropic"`: only return Anthropic-created skills
     */
    source?: string | null;
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface SkillDeleteParams {
    /**
     * Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export declare namespace Skills {
    export { type BetaDeletedSkill as BetaDeletedSkill, type BetaSkill as BetaSkill, type BetaSkillSource as BetaSkillSource, type BetaSkillsPageCursor as BetaSkillsPageCursor, type SkillCreateParams as SkillCreateParams, type SkillRetrieveParams as SkillRetrieveParams, type SkillListParams as SkillListParams, type SkillDeleteParams as SkillDeleteParams, };
    export { Versions as Versions, type BetaDeletedSkillVersion as BetaDeletedSkillVersion, type BetaSkillVersion as BetaSkillVersion, type BetaSkillVersionsPageCursor as BetaSkillVersionsPageCursor, type VersionCreateParams as VersionCreateParams, type VersionRetrieveParams as VersionRetrieveParams, type VersionListParams as VersionListParams, type VersionDeleteParams as VersionDeleteParams, type VersionDownloadParams as VersionDownloadParams, };
}
//# sourceMappingURL=skills.d.mts.map