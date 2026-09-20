import { APIResource } from "../../../core/resource.js";
import * as BetaAPI from "../beta.js";
import { APIPromise } from "../../../core/api-promise.js";
import { PageCursor, type PageCursorParams, PagePromise } from "../../../core/pagination.js";
import { type Uploadable } from "../../../core/uploads.js";
import { RequestOptions } from "../../../internal/request-options.js";
export declare class Versions extends APIResource {
    /**
     * Create Skill Version
     *
     * @example
     * ```ts
     * const betaSkillVersion =
     *   await client.beta.skills.versions.create('skill_id', {
     *     files: [fs.createReadStream('path/to/file')],
     *   });
     * ```
     */
    create(skillID: string, params: VersionCreateParams, options?: RequestOptions): APIPromise<BetaSkillVersion>;
    /**
     * Get Skill Version
     *
     * @example
     * ```ts
     * const betaSkillVersion =
     *   await client.beta.skills.versions.retrieve('version', {
     *     skill_id: 'skill_id',
     *   });
     * ```
     */
    retrieve(version: string, params: VersionRetrieveParams, options?: RequestOptions): APIPromise<BetaSkillVersion>;
    /**
     * List Skill Versions
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaSkillVersion of client.beta.skills.versions.list(
     *   'skill_id',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(skillID: string, params?: VersionListParams | null | undefined, options?: RequestOptions): PagePromise<BetaSkillVersionsPageCursor, BetaSkillVersion>;
    /**
     * Delete Skill Version
     *
     * @example
     * ```ts
     * const betaDeletedSkillVersion =
     *   await client.beta.skills.versions.delete('version', {
     *     skill_id: 'skill_id',
     *   });
     * ```
     */
    delete(version: string, params: VersionDeleteParams, options?: RequestOptions): APIPromise<BetaDeletedSkillVersion>;
    /**
     * Download a skill version's content as a zip archive.
     *
     * @example
     * ```ts
     * const response = await client.beta.skills.versions.download(
     *   'version',
     *   { skill_id: 'skill_id' },
     * );
     *
     * const content = await response.blob();
     * console.log(content);
     * ```
     */
    download(version: string, params: VersionDownloadParams, options?: RequestOptions): APIPromise<Response>;
}
export type BetaSkillVersionsPageCursor = PageCursor<BetaSkillVersion>;
export interface BetaDeletedSkillVersion {
    /**
     * Unique identifier for this Skill Version. The id addresses the version in paths
     * and pins it in references.
     */
    id: string;
    /**
     * Deleted object type.
     *
     * For Skill Versions, this is always `"skill_version_deleted"`.
     */
    type: 'skill_version_deleted';
}
export interface BetaSkillVersion {
    /**
     * Unique identifier for this Skill Version. The id addresses the version in paths
     * and pins it in references.
     */
    id: string;
    /**
     * ISO 8601 timestamp of when the skill was created.
     */
    created_at: string;
    /**
     * Description of the skill version.
     *
     * This is extracted from the SKILL.md file in the skill upload.
     */
    description: string;
    /**
     * The Skill's immutable kebab-case slug, set at creation from the first upload's
     * SKILL.md frontmatter `name` (or its enclosing directory). Every later upload
     * must resolve to the same value. Also the top-level directory of the Skill's
     * mounted files and the base name of a downloaded archive.
     */
    name: string;
    /**
     * Unique identifier for the skill.
     *
     * The format and length of IDs may change over time.
     */
    skill_id: string;
    /**
     * Object type.
     *
     * For Skill Versions, this is always `"skill_version"`.
     */
    type: 'skill_version';
}
export interface VersionCreateParams {
    /**
     * Body param: Files to upload for the skill.
     *
     * All files must be in the same top-level directory and must include a SKILL.md
     * file at the root of that directory.
     */
    files: Array<Uploadable>;
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface VersionRetrieveParams {
    /**
     * Path param: Unique identifier for the skill.
     *
     * The format and length of IDs may change over time.
     */
    skill_id: string;
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface VersionListParams extends PageCursorParams {
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface VersionDeleteParams {
    /**
     * Path param: Unique identifier for the skill.
     *
     * The format and length of IDs may change over time.
     */
    skill_id: string;
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export interface VersionDownloadParams {
    /**
     * Path param: Unique identifier for the skill.
     *
     * The format and length of IDs may change over time.
     */
    skill_id: string;
    /**
     * Header param: Optional header to specify the beta version(s) you want to use.
     */
    betas?: Array<BetaAPI.AnthropicBeta>;
}
export declare namespace Versions {
    export { type BetaDeletedSkillVersion as BetaDeletedSkillVersion, type BetaSkillVersion as BetaSkillVersion, type BetaSkillVersionsPageCursor as BetaSkillVersionsPageCursor, type VersionCreateParams as VersionCreateParams, type VersionRetrieveParams as VersionRetrieveParams, type VersionListParams as VersionListParams, type VersionDeleteParams as VersionDeleteParams, type VersionDownloadParams as VersionDownloadParams, };
}
//# sourceMappingURL=versions.d.ts.map