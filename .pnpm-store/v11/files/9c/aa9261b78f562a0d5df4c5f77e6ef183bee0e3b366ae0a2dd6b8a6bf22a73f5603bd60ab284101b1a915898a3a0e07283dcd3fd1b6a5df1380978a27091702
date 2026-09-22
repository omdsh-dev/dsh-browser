// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../core/resource.mjs";
import * as VersionsAPI from "./versions.mjs";
import { Versions, } from "./versions.mjs";
import { PageCursor } from "../../core/pagination.mjs";
import { multipartFormRequestOptions } from "../../internal/uploads.mjs";
import { path } from "../../internal/utils/path.mjs";
export class Skills extends APIResource {
    constructor() {
        super(...arguments);
        this.versions = new VersionsAPI.Versions(this._client);
    }
    /**
     * Create Skill
     */
    create(body, options) {
        return this._client.post('/v1/skills', multipartFormRequestOptions({ body, ...options }, this._client, false));
    }
    /**
     * Get Skill
     */
    retrieve(skillID, options) {
        return this._client.get(path `/v1/skills/${skillID}`, options);
    }
    /**
     * List Skills
     */
    list(query = {}, options) {
        return this._client.getAPIList('/v1/skills', (PageCursor), { query, ...options });
    }
    /**
     * Delete Skill
     */
    delete(skillID, options) {
        return this._client.delete(path `/v1/skills/${skillID}`, options);
    }
}
Skills.Versions = Versions;
//# sourceMappingURL=skills.mjs.map