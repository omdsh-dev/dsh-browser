// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../core/resource.mjs";
import { PageCursor } from "../core/pagination.mjs";
import { buildHeaders } from "../internal/headers.mjs";
import { stainlessHelperHeaderFromFile } from "../internal/stainless-helper-header.mjs";
import { multipartFormRequestOptions } from "../internal/uploads.mjs";
import { path } from "../internal/utils/path.mjs";
export class Files extends APIResource {
    /**
     * List Files
     */
    list(query = {}, options) {
        return this._client.getAPIList('/v1/files', (PageCursor), { query, ...options });
    }
    /**
     * Delete File
     */
    delete(fileID, options) {
        return this._client.delete(path `/v1/files/${fileID}`, options);
    }
    /**
     * Download File
     */
    download(fileID, options) {
        return this._client.get(path `/v1/files/${fileID}/content`, {
            ...options,
            headers: buildHeaders([{ Accept: 'application/binary' }, options?.headers]),
            __binaryResponse: true,
        });
    }
    /**
     * Get File Metadata
     */
    retrieveMetadata(fileID, options) {
        return this._client.get(path `/v1/files/${fileID}`, options);
    }
    /**
     * Upload File
     */
    upload(body, options) {
        return this._client.post('/v1/files', multipartFormRequestOptions({
            body,
            ...options,
            headers: buildHeaders([stainlessHelperHeaderFromFile(body.file), options?.headers]),
        }, this._client));
    }
}
//# sourceMappingURL=files.mjs.map