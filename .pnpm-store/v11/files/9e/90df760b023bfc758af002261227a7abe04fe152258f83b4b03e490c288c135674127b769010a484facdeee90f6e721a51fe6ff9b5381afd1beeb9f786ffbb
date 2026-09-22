"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Versions = void 0;
const resource_1 = require("../../core/resource.js");
const pagination_1 = require("../../core/pagination.js");
const uploads_1 = require("../../internal/uploads.js");
const path_1 = require("../../internal/utils/path.js");
class Versions extends resource_1.APIResource {
    /**
     * Create Skill Version
     */
    create(skillID, body, options) {
        return this._client.post((0, path_1.path) `/v1/skills/${skillID}/versions`, (0, uploads_1.multipartFormRequestOptions)({ body, ...options }, this._client, false));
    }
    /**
     * Get Skill Version
     */
    retrieve(version, params, options) {
        const { skill_id } = params;
        return this._client.get((0, path_1.path) `/v1/skills/${skill_id}/versions/${version}`, options);
    }
    /**
     * List Skill Versions
     */
    list(skillID, query = {}, options) {
        return this._client.getAPIList((0, path_1.path) `/v1/skills/${skillID}/versions`, (pagination_1.PageCursor), {
            query,
            ...options,
        });
    }
    /**
     * Delete Skill Version
     */
    delete(version, params, options) {
        const { skill_id } = params;
        return this._client.delete((0, path_1.path) `/v1/skills/${skill_id}/versions/${version}`, options);
    }
}
exports.Versions = Versions;
//# sourceMappingURL=versions.js.map