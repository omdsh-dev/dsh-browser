"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skills = void 0;
const tslib_1 = require("../../internal/tslib.js");
const resource_1 = require("../../core/resource.js");
const VersionsAPI = tslib_1.__importStar(require("./versions.js"));
const versions_1 = require("./versions.js");
const pagination_1 = require("../../core/pagination.js");
const uploads_1 = require("../../internal/uploads.js");
const path_1 = require("../../internal/utils/path.js");
class Skills extends resource_1.APIResource {
    constructor() {
        super(...arguments);
        this.versions = new VersionsAPI.Versions(this._client);
    }
    /**
     * Create Skill
     */
    create(body, options) {
        return this._client.post('/v1/skills', (0, uploads_1.multipartFormRequestOptions)({ body, ...options }, this._client, false));
    }
    /**
     * Get Skill
     */
    retrieve(skillID, options) {
        return this._client.get((0, path_1.path) `/v1/skills/${skillID}`, options);
    }
    /**
     * List Skills
     */
    list(query = {}, options) {
        return this._client.getAPIList('/v1/skills', (pagination_1.PageCursor), { query, ...options });
    }
    /**
     * Delete Skill
     */
    delete(skillID, options) {
        return this._client.delete((0, path_1.path) `/v1/skills/${skillID}`, options);
    }
}
exports.Skills = Skills;
Skills.Versions = versions_1.Versions;
//# sourceMappingURL=skills.js.map