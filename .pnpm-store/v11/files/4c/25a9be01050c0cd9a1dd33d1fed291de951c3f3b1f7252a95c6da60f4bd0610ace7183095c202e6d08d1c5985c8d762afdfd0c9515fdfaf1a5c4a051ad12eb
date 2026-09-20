"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Certificates = void 0;
const resource_1 = require("../../../core/resource.js");
const pagination_1 = require("../../../core/pagination.js");
const headers_1 = require("../../../internal/headers.js");
const path_1 = require("../../../internal/utils/path.js");
class Certificates extends resource_1.APIResource {
    /**
     * The Tunnels API is in research preview. It requires the
     * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
     * deprecation period. It supersedes the Admin API endpoints at
     * `/v1/organizations/tunnels`, which remain available during a migration window.
     *
     * Registers a public CA certificate on a tunnel. Anthropic verifies the gateway's
     * server certificate against this CA when it terminates the inner TLS session. A
     * tunnel holds at most two non-archived certificates.
     *
     * @example
     * ```ts
     * const betaTunnelCertificate =
     *   await client.beta.tunnels.certificates.create(
     *     'tunnel_id',
     *     { ca_certificate_pem: 'ca_certificate_pem' },
     *   );
     * ```
     */
    create(tunnelID, params, options) {
        const { betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/tunnels/${tunnelID}/certificates?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'mcp-tunnels-2026-06-22'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * The Tunnels API is in research preview. It requires the
     * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
     * deprecation period. It supersedes the Admin API endpoints at
     * `/v1/organizations/tunnels`, which remain available during a migration window.
     *
     * Fetches a tunnel certificate by ID.
     *
     * @example
     * ```ts
     * const betaTunnelCertificate =
     *   await client.beta.tunnels.certificates.retrieve(
     *     'certificate_id',
     *     { tunnel_id: 'tunnel_id' },
     *   );
     * ```
     */
    retrieve(certificateID, params, options) {
        const { tunnel_id, betas } = params;
        return this._client.get((0, path_1.path) `/v1/tunnels/${tunnel_id}/certificates/${certificateID}?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'mcp-tunnels-2026-06-22'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * The Tunnels API is in research preview. It requires the
     * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
     * deprecation period. It supersedes the Admin API endpoints at
     * `/v1/organizations/tunnels`, which remain available during a migration window.
     *
     * Lists the certificates registered on a tunnel. Archived certificates are
     * excluded unless include_archived is set.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaTunnelCertificate of client.beta.tunnels.certificates.list(
     *   'tunnel_id',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(tunnelID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList((0, path_1.path) `/v1/tunnels/${tunnelID}/certificates?beta=true`, (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'mcp-tunnels-2026-06-22'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * The Tunnels API is in research preview. It requires the
     * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
     * deprecation period. It supersedes the Admin API endpoints at
     * `/v1/organizations/tunnels`, which remain available during a migration window.
     *
     * Archives a tunnel certificate, removing it from the set Anthropic trusts for the
     * tunnel. The certificate record is retained. Archiving the last non-archived
     * certificate is permitted; the tunnel rejects MCP traffic until a new certificate
     * is added.
     *
     * @example
     * ```ts
     * const betaTunnelCertificate =
     *   await client.beta.tunnels.certificates.archive(
     *     'certificate_id',
     *     { tunnel_id: 'tunnel_id' },
     *   );
     * ```
     */
    archive(certificateID, params, options) {
        const { tunnel_id, betas } = params;
        return this._client.post((0, path_1.path) `/v1/tunnels/${tunnel_id}/certificates/${certificateID}/archive?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'mcp-tunnels-2026-06-22'].toString() },
                options?.headers,
            ]),
        });
    }
}
exports.Certificates = Certificates;
//# sourceMappingURL=certificates.js.map