// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../core/resource.mjs";
import { PageCursor } from "../../core/pagination.mjs";
import { multipartFormRequestOptions } from "../../internal/uploads.mjs";
import { path } from "../../internal/utils/path.mjs";
export class Versions extends APIResource {
    /**
     * Create Skill Version
     */
    create(skillID, body, options) {
        return this._client.post(path `/v1/skills/${skillID}/versions`, multipartFormRequestOptions({ body, ...options }, this._client, false));
    }
    /**
     * Get Skill Version
     */
    retrieve(version, params, options) {
        const { skill_id } = params;
        return this._client.get(path `/v1/skills/${skill_id}/versions/${version}`, options);
    }
    /**
     * List Skill Versions
     */
    list(skillID, query = {}, options) {
        return this._client.getAPIList(path `/v1/skills/${skillID}/versions`, (PageCursor), {
            query,
            ...options,
        });
    }
    /**
     * Delete Skill Version
     */
    delete(version, params, options) {
        const { skill_id } = params;
        return this._client.delete(path `/v1/skills/${skill_id}/versions/${version}`, options);
    }
}
//# sourceMappingURL=versions.mjs.map