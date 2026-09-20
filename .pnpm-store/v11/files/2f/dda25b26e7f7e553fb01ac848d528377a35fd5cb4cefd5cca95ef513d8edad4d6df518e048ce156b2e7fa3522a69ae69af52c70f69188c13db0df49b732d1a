"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Files = void 0;
const resource_1 = require("../core/resource.js");
const pagination_1 = require("../core/pagination.js");
const headers_1 = require("../internal/headers.js");
const stainless_helper_header_1 = require("../internal/stainless-helper-header.js");
const uploads_1 = require("../internal/uploads.js");
const path_1 = require("../internal/utils/path.js");
class Files extends resource_1.APIResource {
    /**
     * List Files
     */
    list(query = {}, options) {
        return this._client.getAPIList('/v1/files', (pagination_1.PageCursor), { query, ...options });
    }
    /**
     * Delete File
     */
    delete(fileID, options) {
        return this._client.delete((0, path_1.path) `/v1/files/${fileID}`, options);
    }
    /**
     * Download File
     */
    download(fileID, options) {
        return this._client.get((0, path_1.path) `/v1/files/${fileID}/content`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([{ Accept: 'application/binary' }, options?.headers]),
            __binaryResponse: true,
        });
    }
    /**
     * Get File Metadata
     */
    retrieveMetadata(fileID, options) {
        return this._client.get((0, path_1.path) `/v1/files/${fileID}`, options);
    }
    /**
     * Upload File
     */
    upload(body, options) {
        return this._client.post('/v1/files', (0, uploads_1.multipartFormRequestOptions)({
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([(0, stainless_helper_header_1.stainlessHelperHeaderFromFile)(body.file), options?.headers]),
        }, this._client));
    }
}
exports.Files = Files;
//# sourceMappingURL=files.js.map