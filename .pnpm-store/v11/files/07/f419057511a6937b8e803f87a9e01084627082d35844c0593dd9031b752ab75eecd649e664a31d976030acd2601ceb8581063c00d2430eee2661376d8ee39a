"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tunnels = void 0;
const tslib_1 = require("../../../internal/tslib.js");
const resource_1 = require("../../../core/resource.js");
const CertificatesAPI = tslib_1.__importStar(require("./certificates.js"));
const certificates_1 = require("./certificates.js");
const pagination_1 = require("../../../core/pagination.js");
const headers_1 = require("../../../internal/headers.js");
const path_1 = require("../../../internal/utils/path.js");
class Tunnels extends resource_1.APIResource {
    constructor() {
        super(...arguments);
        this.certificates = new CertificatesAPI.Certificates(this._client);
    }
    /**
     * The Tunnels API is in research preview. It requires the
     * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
     * deprecation period. It supersedes the Admin API endpoints at
     * `/v1/organizations/tunnels`, which remain available during a migration window.
     *
     * Creates a tunnel. Creation allocates a fresh hostname and provisions the tunnel;
     * it is not idempotent. The new tunnel rejects MCP traffic until at least one CA
     * certificate is added.
     *
     * @example
     * ```ts
     * const betaTunnel = await client.beta.tunnels.create();
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/tunnels?beta=true', {
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
     * Fetches a tunnel by ID.
     *
     * @example
     * ```ts
     * const betaTunnel = await client.beta.tunnels.retrieve(
     *   'tunnel_id',
     * );
     * ```
     */
    retrieve(tunnelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path) `/v1/tunnels/${tunnelID}?beta=true`, {
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
     * Lists tunnels. Results are ordered by creation time, newest first; archived
     * tunnels are excluded unless include_archived is set.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaTunnel of client.beta.tunnels.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/tunnels?beta=true', (pagination_1.PageCursor), {
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
     * Archives a tunnel. Archival is irreversible: every non-archived certificate on
     * the tunnel is archived in the same operation, the hostname is retired and never
     * re-allocated, and the tunnel token is invalidated. Retrying against an
     * already-archived tunnel returns the existing record unchanged.
     *
     * @example
     * ```ts
     * const betaTunnel = await client.beta.tunnels.archive(
     *   'tunnel_id',
     * );
     * ```
     */
    archive(tunnelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/tunnels/${tunnelID}/archive?beta=true`, {
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
     * Reveals a tunnel's connector token. The value is fetched live on each call;
     * Anthropic does not store it. Repeated calls return the same value until the
     * token is rotated. Exposed as POST so the token does not appear in intermediary
     * access logs.
     *
     * @example
     * ```ts
     * const betaTunnelToken =
     *   await client.beta.tunnels.revealToken('tunnel_id');
     * ```
     */
    revealToken(tunnelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/tunnels/${tunnelID}/reveal_token?beta=true`, {
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
     * Rotates a tunnel's connector token. Rotation invalidates the current token for
     * new connections and returns a fresh value; established connections are not
     * severed. A connector restarted after rotation must use the new value.
     *
     * @example
     * ```ts
     * const betaTunnelToken =
     *   await client.beta.tunnels.rotateToken('tunnel_id');
     * ```
     */
    rotateToken(tunnelID, params, options) {
        const { betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/tunnels/${tunnelID}/rotate_token?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'mcp-tunnels-2026-06-22'].toString() },
                options?.headers,
            ]),
        });
    }
}
exports.Tunnels = Tunnels;
Tunnels.Certificates = certificates_1.Certificates;
//# sourceMappingURL=tunnels.js.map