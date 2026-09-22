// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
var _BaseAnthropic_instances, _a, _BaseAnthropic_encoder, _BaseAnthropic_baseURLOverridden;
import { __classPrivateFieldGet, __classPrivateFieldSet } from "./internal/tslib.mjs";
import { uuid4 } from "./internal/utils/uuid.mjs";
import { validatePositiveInteger, isAbsoluteURL, safeJSON } from "./internal/utils/values.mjs";
import { sleep } from "./internal/utils/sleep.mjs";
import { castToError, isAbortError } from "./internal/errors.mjs";
import { getPlatformHeaders } from "./internal/detect-platform.mjs";
import { armAbandonmentBackstop, registerRequestSignalCleanup, releaseRequestSignal, } from "./internal/request-signal.mjs";
import * as Shims from "./internal/shims.mjs";
import * as Opts from "./internal/request-options.mjs";
import { stringifyQuery } from "./internal/utils/query.mjs";
import { VERSION } from "./version.mjs";
import * as Errors from "./core/error.mjs";
import { OAUTH_API_BETA_HEADER } from "./lib/credentials/types.mjs";
import { TokenCache } from "./lib/credentials/token-cache.mjs";
import { defaultCredentials, resolveCredentialsFromConfig } from "./lib/credentials/credential-chain.mjs";
import { isFetchOriginError, isRetryableError, wrapFetchWithMiddleware, } from "./core/middleware.mjs";
import * as Pagination from "./core/pagination.mjs";
import * as Uploads from "./core/uploads.mjs";
import * as API from "./resources/index.mjs";
import { APIPromise } from "./core/api-promise.mjs";
import { Completions, } from "./resources/completions.mjs";
import { Files, } from "./resources/files.mjs";
import { Models, } from "./resources/models.mjs";
import { Beta, } from "./resources/beta/beta.mjs";
import { Messages, } from "./resources/messages/messages.mjs";
import { Skills, } from "./resources/skills/skills.mjs";
import { isRunningInBrowser } from "./internal/detect-platform.mjs";
import { buildHeaders } from "./internal/headers.mjs";
import { readEnv } from "./internal/utils/env.mjs";
import { defaultLogLevel, formatRequestDetails, loggerFor, parseLogLevel, } from "./internal/utils/log.mjs";
import { isEmptyObj } from "./internal/utils/values.mjs";
export const HUMAN_PROMPT = '\\n\\nHuman:';
export const AI_PROMPT = '\\n\\nAssistant:';
/**
 * Base class for Anthropic API clients.
 */
export class BaseAnthropic {
    /**
     * The active credential provider. Default credential resolution runs once
     * at construction time. If it fails, the error is surfaced on every
     * request and the client must be reconstructed — there is no retry path.
     *
     * Clones returned by {@link withOptions} share the parent's auth state
     * (provider, token cache, pending resolution, and any resolution error)
     * unless the caller passes an explicit `apiKey`, `authToken`,
     * `credentials`, `config`, or `profile` override.
     */
    get credentials() {
        return this._authState.provider;
    }
    /**
     * API Client for interfacing with the Anthropic API.
     *
     * @param {string | null | undefined} [opts.apiKey=process.env['ANTHROPIC_API_KEY'] ?? null]
     * @param {string | null | undefined} [opts.authToken=process.env['ANTHROPIC_AUTH_TOKEN'] ?? null]
     * @param {string | null | undefined} [opts.webhookKey=process.env['ANTHROPIC_WEBHOOK_SIGNING_KEY'] ?? null]
     * @param {string} [opts.baseURL=process.env['ANTHROPIC_BASE_URL'] ?? https://api.anthropic.com] - Override the default base URL for the API.
     * @param {number} [opts.timeout=10 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
     * @param {MergedRequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
     * @param {Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
     * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
     * @param {HeadersLike} opts.defaultHeaders - Default headers to include with every request to the API.
     * @param {Record<string, string | undefined>} opts.defaultQuery - Default query parameters to include with every request to the API.
     * @param {boolean} [opts.dangerouslyAllowBrowser=false] - By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
     */
    constructor({ baseURL = readEnv('ANTHROPIC_BASE_URL'), apiKey, authToken, webhookKey = readEnv('ANTHROPIC_WEBHOOK_SIGNING_KEY') ?? null, ...opts } = {}) {
        _BaseAnthropic_instances.add(this);
        this._requestAuthFlags = new WeakMap();
        _BaseAnthropic_encoder.set(this, void 0);
        // An explicit `profile` is a constructor-level credential choice; when set,
        // do not let env ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN shadow it.
        if (apiKey === undefined) {
            apiKey = opts.profile != null ? null : readEnv('ANTHROPIC_API_KEY') ?? null;
        }
        if (authToken === undefined) {
            authToken = opts.profile != null ? null : readEnv('ANTHROPIC_AUTH_TOKEN') ?? null;
        }
        if (opts.profile != null && (opts.credentials != null || opts.config != null)) {
            throw new TypeError('Pass at most one of `profile`, `credentials`, or `config`.');
        }
        const options = {
            apiKey,
            authToken,
            webhookKey,
            ...opts,
            baseURL: baseURL || `https://api.anthropic.com`,
        };
        if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) {
            throw new Errors.AnthropicError("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew Anthropic({ apiKey, dangerouslyAllowBrowser: true });\n");
        }
        this.baseURL = options.baseURL;
        // After destructuring, `baseURL` is the constructor arg or
        // ANTHROPIC_BASE_URL — both count as an explicit choice that a profile
        // base_url must not override. A falsy value means we fell through to the
        // hardcoded default above and a profile may supply the host. withOptions()
        // propagates the parent's flag via __baseURLIsExplicit so a non-overriding
        // clone doesn't mistake the inherited baseURL for a caller-supplied one.
        this._baseURLIsExplicit = opts.__baseURLIsExplicit ?? !!baseURL;
        this.timeout = options.timeout ?? _a.DEFAULT_TIMEOUT /* 10 minutes */;
        this.logger = options.logger ?? console;
        // Set default logLevel early so that we can log a warning in parseLogLevel.
        this.logLevel = defaultLogLevel;
        this.logLevel =
            parseLogLevel(options.logLevel, 'ClientOptions.logLevel', loggerFor(this)) ??
                parseLogLevel(readEnv('ANTHROPIC_LOG'), "process.env['ANTHROPIC_LOG']", loggerFor(this)) ??
                defaultLogLevel;
        this.fetchOptions = options.fetchOptions;
        this.maxRetries = options.maxRetries ?? 2;
        this.fetch = options.fetch ?? Shims.getDefaultFetch();
        __classPrivateFieldSet(this, _BaseAnthropic_encoder, Opts.FallbackEncoder, "f");
        this.middleware = [...(options.middleware ?? [])];
        const customHeadersEnv = readEnv('ANTHROPIC_CUSTOM_HEADERS');
        if (customHeadersEnv) {
            const parsed = {};
            for (const line of customHeadersEnv.split('\n')) {
                const colon = line.indexOf(':');
                if (colon >= 0) {
                    parsed[line.substring(0, colon).trim()] = line.substring(colon + 1).trim();
                }
            }
            options.defaultHeaders = { ...parsed, ...options.defaultHeaders };
        }
        const inherited = opts.__auth;
        // Never persist the internal __auth handle on _options — it's a
        // one-shot constructor signal, and leaking it through _options would
        // cause withOptions() to spread a stale value into clones.
        delete options.__auth;
        delete options.__baseURLIsExplicit;
        this._options = options;
        this.apiKey = typeof apiKey === 'string' ? apiKey : null;
        this.authToken = authToken;
        this.webhookKey = webhookKey;
        if (inherited) {
            this._authState = inherited;
            if (!this._baseURLIsExplicit && inherited.baseURL) {
                this.baseURL = inherited.baseURL;
            }
        }
        else {
            this._authState = { provider: null, tokenCache: null, resolution: null, error: null, extraHeaders: {} };
            // apiKey/authToken win over credentials/config/profile; don't build a
            // token cache or resolve a config that the request path will then ignore.
            if (this.apiKey == null && this.authToken == null) {
                const credentials = options.credentials ?? null;
                if (credentials) {
                    this._authState.provider = credentials;
                    this._authState.tokenCache = this._makeTokenCache(credentials);
                }
                else if (options.config != null) {
                    const result = resolveCredentialsFromConfig(options.config, this._credentialResolverOptions());
                    this._authState.provider = result.provider;
                    this._authState.tokenCache = this._makeTokenCache(result.provider);
                    this._authState.extraHeaders = result.extraHeaders;
                    this._applyCredentialBaseURL(result.baseURL);
                }
                else if (options.profile != null) {
                    this._authState.resolution = this._resolveDefaultCredentials(options.profile);
                }
                else if (this._shouldResolveDefaultCredentials()) {
                    // No explicit auth provided — lazily resolve from the credential
                    // chain on first request. Errors are captured into _auth.error and
                    // surfaced on first use rather than as an unhandled rejection.
                    this._authState.resolution = this._resolveDefaultCredentials();
                }
            }
        }
    }
    /**
     * Whether to lazily resolve auth from the default credential chain when no
     * explicit auth is configured. Called once from the constructor, so
     * overrides must not depend on subclass instance state. Subclasses that
     * bring their own auth scheme return false so unrelated local credentials
     * are never resolved or allowed to supply a base URL.
     */
    _shouldResolveDefaultCredentials() {
        return true;
    }
    /**
     * Stores a profile/config-supplied base URL on the shared auth state and, if
     * the caller did not pin `baseURL` via constructor option or env, adopts it
     * as this client's outbound API host. Precedence: ctor opt > env > profile >
     * hardcoded default.
     */
    _applyCredentialBaseURL(baseURL) {
        if (!baseURL)
            return;
        const normalized = baseURL.replace(/\/+$/, '');
        this._authState.baseURL = normalized;
        if (!this._baseURLIsExplicit) {
            this.baseURL = normalized;
        }
    }
    /**
     * Options bag passed into the credential chain. `baseURL` here is only the
     * fallback host for the token-exchange POST when the config itself omits
     * `base_url`; the chain returns the config's own `base_url` (if any) on
     * {@link CredentialResult.baseURL}, which {@link _applyCredentialBaseURL}
     * then adopts for outbound API requests. The two are deliberately decoupled
     * so this fallback never round-trips into precedence.
     */
    _credentialResolverOptions() {
        return {
            baseURL: this.baseURL,
            fetch: this._credentialsFetch(),
            userAgent: this.getUserAgent(),
            onCacheWriteError: (err) => {
                loggerFor(this).debug('credential cache write failed (best-effort)', err);
            },
            onSafetyWarning: (msg) => {
                loggerFor(this).warn(msg);
            },
        };
    }
    /**
     * A `Fetch` for first-party credential token-exchange requests (OIDC
     * federation jwt-bearer grants, user-OAuth refresh grants) that routes
     * through this client's middleware chain, so middleware observes token
     * traffic like any other request. Only client-level middleware applies:
     * a minted token is shared across requests, so attributing the exchange
     * to any one request's per-request middleware would be arbitrary. For the
     * same reason, `ctx.options` is undefined for these requests.
     */
    _credentialsFetch() {
        return wrapFetchWithMiddleware(this.fetch, this.middleware, undefined, this);
    }
    _makeTokenCache(provider) {
        return new TokenCache(provider, (err) => {
            loggerFor(this).debug('advisory token refresh failed; serving cached token', err);
        });
    }
    /**
     * Create a new client instance re-using the same options given to the current client with optional overriding.
     */
    withOptions(options) {
        // Share the auth state object unless the caller passes any auth-related
        // key. The `in` check is intentional: even `apiKey: undefined` opts the
        // clone out of sharing (it gets its own _auth and TokenCache, though it
        // may still wrap the parent's provider via the credentials spread below).
        const overridesStructuredAuth = 'credentials' in options || 'config' in options || 'profile' in options;
        const overridesAuth = 'apiKey' in options || 'authToken' in options || overridesStructuredAuth;
        const internal = {
            ...this._options,
            // Only forward baseURL when the caller (or env) explicitly chose it.
            // For a non-explicit parent, this.baseURL may have been mutated to the
            // profile-resolved host; pinning that as the clone's options.baseURL
            // would make _options on the clone misreport caller intent and would
            // leave the clone stuck on the parent's host across an auth override.
            // The clone instead receives the construction-time value via
            // ...this._options above and re-adopts the profile host through the
            // shared _authState.baseURL + __baseURLIsExplicit=false path.
            ...(this._baseURLIsExplicit ? { baseURL: this.baseURL } : {}),
            maxRetries: this.maxRetries,
            timeout: this.timeout,
            logger: this.logger,
            logLevel: this.logLevel,
            fetch: this.fetch,
            fetchOptions: this.fetchOptions,
            middleware: this.middleware,
            apiKey: this.apiKey,
            authToken: this.authToken,
            webhookKey: this.webhookKey,
            // credentials: this.credentials is a no-op when __auth is shared (the
            // ctor takes the inherited path and ignores options.credentials); when
            // overridesAuth is true via apiKey/authToken only, it lets the clone
            // build a fresh TokenCache around the parent's provider.
            credentials: this.credentials,
            // When the caller passes a structured-credential override, drop inherited
            // structured-credential options so only `...options` supplies them —
            // otherwise an inherited `credentials`/`config`/`profile` would trip the
            // mutual-exclusion check or precedence over the override.
            ...(overridesStructuredAuth ? { credentials: undefined, config: undefined, profile: undefined } : {}),
            ...options,
            // Always set __auth so any stale value from ...this._options is
            // overwritten. undefined means "build fresh auth from these options".
            __auth: overridesAuth ? undefined : this._authState,
            __baseURLIsExplicit: 'baseURL' in options ? true : this._baseURLIsExplicit,
        };
        return new this.constructor(internal);
    }
    /**
     * Lazily resolves credentials from config files or environment variables.
     * Called once from the constructor when no explicit auth is provided, or
     * when an explicit `profile` was passed (in which case a missing/unresolved
     * profile is surfaced as an error instead of falling through to "no auth").
     * The returned promise is stored and awaited on the first request.
     */
    async _resolveDefaultCredentials(profile) {
        try {
            const result = await defaultCredentials(this._credentialResolverOptions(), profile);
            if (result) {
                this._authState.provider = result.provider;
                this._authState.tokenCache = this._makeTokenCache(result.provider);
                this._authState.extraHeaders = result.extraHeaders;
                this._applyCredentialBaseURL(result.baseURL);
            }
            else if (profile != null) {
                throw new Errors.AnthropicError(`Profile "${profile}" could not be resolved (no <config_dir>/configs/${profile}.json found).`);
            }
        }
        catch (err) {
            this._authState.error = err;
        }
        finally {
            this._authState.resolution = null;
        }
    }
    defaultQuery() {
        return this._options.defaultQuery;
    }
    validateHeaders({ values, nulls }) {
        if (values.get('x-api-key') || values.get('authorization')) {
            return;
        }
        if (this._authState.error) {
            throw this._authState.error;
        }
        if (this._authState.tokenCache || this._authState.resolution) {
            return; // auth will be injected per-request via authHeaders
        }
        if (this.apiKey && values.get('x-api-key')) {
            return;
        }
        if (nulls.has('x-api-key')) {
            return;
        }
        if (this.authToken && values.get('authorization')) {
            return;
        }
        if (nulls.has('authorization')) {
            return;
        }
        throw new Error('Could not resolve authentication method. Expected one of apiKey, authToken, credentials, config, or profile to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted');
    }
    _authFlags(opts) {
        let flags = this._requestAuthFlags.get(opts);
        if (!flags) {
            flags = { usedTokenCache: false, didRefreshFor401: false };
            this._requestAuthFlags.set(opts, flags);
        }
        return flags;
    }
    async authHeaders(opts) {
        // Wait for lazy credential resolution if it's in progress. If it failed,
        // return no auth headers — validateHeaders surfaces the stored error
        // after the explicit-header escape hatch has had a chance to apply.
        if (this._authState.resolution) {
            await this._authState.resolution;
        }
        if (this._authState.error) {
            return undefined;
        }
        // If we have a token cache and no API key is set, use token auth
        if (this._authState.tokenCache && this.apiKey == null) {
            const token = await this._authState.tokenCache.getToken();
            this._authFlags(opts).usedTokenCache = true;
            return buildHeaders([{ Authorization: `Bearer ${token}` }]);
        }
        return buildHeaders([await this.apiKeyAuth(opts), await this.bearerAuth(opts)]);
    }
    async apiKeyAuth(opts) {
        if (this.apiKey == null) {
            return undefined;
        }
        return buildHeaders([{ 'X-Api-Key': this.apiKey }]);
    }
    async bearerAuth(opts) {
        if (this.authToken == null) {
            return undefined;
        }
        return buildHeaders([{ Authorization: `Bearer ${this.authToken}` }]);
    }
    stringifyQuery(query) {
        return stringifyQuery(query);
    }
    getUserAgent() {
        return `Anthropic/JS ${VERSION}`;
    }
    defaultIdempotencyKey() {
        return `stainless-node-retry-${uuid4()}`;
    }
    makeStatusError(status, error, message, headers) {
        return Errors.APIError.generate(status, error, message, headers);
    }
    buildURL(path, query, defaultBaseURL) {
        const baseURL = (!__classPrivateFieldGet(this, _BaseAnthropic_instances, "m", _BaseAnthropic_baseURLOverridden).call(this) && defaultBaseURL) || this.baseURL;
        const url = isAbsoluteURL(path) ?
            new URL(path)
            : new URL(baseURL + (baseURL.endsWith('/') && path.startsWith('/') ? path.slice(1) : path));
        const defaultQuery = this.defaultQuery();
        const pathQuery = Object.fromEntries(url.searchParams);
        if (!isEmptyObj(defaultQuery) || !isEmptyObj(pathQuery)) {
            query = { ...pathQuery, ...defaultQuery, ...query };
        }
        if (typeof query === 'object' && query && !Array.isArray(query)) {
            url.search = this.stringifyQuery(query);
        }
        return url.toString();
    }
    _calculateNonstreamingTimeout(maxTokens) {
        const defaultTimeout = 10 * 60;
        const expectedTimeout = (60 * 60 * maxTokens) / 128000;
        if (expectedTimeout > defaultTimeout) {
            throw new Errors.AnthropicError('Streaming is required for operations that may take longer than 10 minutes. ' +
                'See https://github.com/anthropics/anthropic-sdk-typescript#streaming-responses for more details');
        }
        return defaultTimeout * 1000;
    }
    /**
     * Used as a callback for mutating the given `FinalRequestOptions` object.
     */
    async prepareOptions(options) { }
    /**
     * Used as a callback for mutating the given `RequestInit` object.
     *
     * This is useful for cases where you want to add certain headers based off of
     * the request properties, e.g. `method` or `url`.
     *
     * Runs after all middleware (including {@link backendMiddleware}),
     * immediately before each underlying fetch call, so it sees exactly what
     * goes over the wire. Middleware may replay a request by calling `next()`
     * more than once, so this hook can run multiple times per attempt:
     * overrides must be idempotent and overwrite headers from a previous
     * invocation rather than append to them.
     */
    async prepareRequest(request, { url, options }) {
        // Append auth-derived headers when using token auth. Done here (after all
        // header merging) rather than in authHeaders() so we append to any existing
        // anthropic-beta values instead of being overwritten by later header sources.
        if (this._authState.tokenCache && this.apiKey == null) {
            // Normalize to a Headers instance — custom fetch impls or polyfills can
            // hand back arrays / plain objects, and silently dropping the beta
            // header in that case would surface as a confusing server-side 4xx.
            const headers = request.headers instanceof Headers ? request.headers : new Headers(request.headers);
            for (const [k, v] of Object.entries(this._authState.extraHeaders)) {
                if (!headers.has(k))
                    headers.set(k, v);
            }
            const existing = headers
                .get('anthropic-beta')
                ?.split(',')
                .map((s) => s.trim());
            if (!existing?.includes(OAUTH_API_BETA_HEADER)) {
                headers.append('anthropic-beta', OAUTH_API_BETA_HEADER);
            }
            request.headers = headers;
        }
    }
    /**
     * Internal {@link Middleware} composed innermost in the chain — inside both
     * client-level and per-request middleware, immediately around the underlying
     * `fetch`. Subclasses for third-party backends override this to adapt the
     * canonical Anthropic-shaped request to the backend's wire shape (URL/body
     * rewriting, request signing) and to normalize the wire response back to the
     * canonical shape (e.g. AWS EventStream to SSE).
     *
     * Running inside the user's middleware means user middleware always observes
     * canonical Anthropic-shaped traffic, and the adaptation re-runs (e.g.
     * re-signs) on every `next()` invocation, covering whatever the middleware
     * mutated.
     *
     * Errors thrown here follow the middleware error policy: they propagate to
     * the caller as-is — no retries, no `APIConnectionError` wrapping — unless
     * retryable (see {@link Middleware}); throw a `RetryableError` to opt into
     * the retry path.
     */
    backendMiddleware() {
        return [];
    }
    get(path, opts) {
        return this.methodRequest('get', path, opts);
    }
    post(path, opts) {
        return this.methodRequest('post', path, opts);
    }
    patch(path, opts) {
        return this.methodRequest('patch', path, opts);
    }
    put(path, opts) {
        return this.methodRequest('put', path, opts);
    }
    delete(path, opts) {
        return this.methodRequest('delete', path, opts);
    }
    methodRequest(method, path, opts) {
        return this.request(Promise.resolve(opts).then((opts) => {
            return { method, path, ...opts };
        }));
    }
    request(options, remainingRetries = null) {
        return new APIPromise(this, this.makeRequest(options, remainingRetries, undefined));
    }
    async makeRequest(optionsInput, retriesRemaining, retryOfRequestLogID) {
        const options = await optionsInput;
        const maxRetries = options.maxRetries ?? this.maxRetries;
        if (retriesRemaining == null) {
            retriesRemaining = maxRetries;
            // Top-level call: reset per-request auth flags so a reused options object
            // (via client.request(opts)) doesn't carry stale 401-refresh state.
            this._requestAuthFlags.delete(options);
        }
        await this.prepareOptions(options);
        const { req, url, timeout } = await this.buildRequest(options, {
            retryCount: maxRetries - retriesRemaining,
        });
        /** Not an API request ID, just for correlating local log entries. */
        const requestLogID = 'log_' + ((Math.random() * (1 << 24)) | 0).toString(16).padStart(6, '0');
        const retryLogStr = retryOfRequestLogID === undefined ? '' : `, retryOf: ${retryOfRequestLogID}`;
        const startTime = Date.now();
        if (options.signal?.aborted) {
            throw new Errors.APIUserAbortError();
        }
        const controller = new AbortController();
        const response = await this.fetchWithTimeout(url, req, timeout, controller, options, {
            requestLogID,
            retryOfRequestLogID,
        }).catch(castToError);
        const headersTime = Date.now();
        if (response instanceof globalThis.Error) {
            releaseRequestSignal(controller);
            const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
            if (options.signal?.aborted) {
                throw new Errors.APIUserAbortError();
            }
            // detect native connection timeout errors
            // deno throws "TypeError: error sending request for url (https://example/): client error (Connect): tcp connect error: Operation timed out (os error 60): Operation timed out (os error 60)"
            // undici throws "TypeError: fetch failed" with cause "ConnectTimeoutError: Connect Timeout Error (attempted address: example:443, timeout: 1ms)"
            // others do not provide enough information to distinguish timeouts from other connection errors
            const isTimeout = isAbortError(response) ||
                /timed? ?out/i.test(String(response) + ('cause' in response ? String(response.cause) : ''));
            // Errors thrown by middleware (user middleware and the backend adaptation
            // alike) propagate to the caller as-is — no retries, no APIConnectionError
            // wrapping — except retryable errors (timeouts/aborts, APIConnectionErrors,
            // and RetryableErrors, directly or in the `cause` chain), which stay on the
            // retry path.
            const hasMiddleware = this.middleware.length > 0 || !!options.middleware?.length || this.backendMiddleware().length > 0;
            if (hasMiddleware && !isTimeout && !isRetryableError(response)) {
                loggerFor(this).info(`[${requestLogID}] middleware error (not retryable)`);
                loggerFor(this).debug(`[${requestLogID}] middleware error (not retryable)`, formatRequestDetails({
                    retryOfRequestLogID,
                    url,
                    durationMs: headersTime - startTime,
                    message: response.message,
                }));
                throw response;
            }
            if (retriesRemaining) {
                loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? 'timed out' : 'failed'} - ${retryMessage}`);
                loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? 'timed out' : 'failed'} (${retryMessage})`, formatRequestDetails({
                    retryOfRequestLogID,
                    url,
                    durationMs: headersTime - startTime,
                    message: response.message,
                }));
                return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
            }
            loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? 'timed out' : 'failed'} - error; no more retries left`);
            loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? 'timed out' : 'failed'} (error; no more retries left)`, formatRequestDetails({
                retryOfRequestLogID,
                url,
                durationMs: headersTime - startTime,
                message: response.message,
            }));
            if (isTimeout) {
                throw new Errors.APIConnectionTimeoutError();
            }
            // a retryable middleware-origin error is still the caller's error: once retries are
            // exhausted it propagates as-is rather than wrapped in APIConnectionError
            if (hasMiddleware && !isFetchOriginError(response)) {
                throw response;
            }
            throw new Errors.APIConnectionError({ cause: response });
        }
        const specialHeaders = [...response.headers.entries()]
            .filter(([name]) => name === 'request-id' || name === 'anthropic-workspace-id')
            .map(([name, value]) => ', ' + name + ': ' + JSON.stringify(value))
            .join('');
        const responseInfo = `[${requestLogID}${retryLogStr}${specialHeaders}] ${req.method} ${url} ${response.ok ? 'succeeded' : 'failed'} with status ${response.status} in ${headersTime - startTime}ms`;
        if (!response.ok) {
            const shouldRetry = await this.shouldRetry(response, options);
            if (retriesRemaining && shouldRetry) {
                const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
                // We don't need the body of this response.
                await Shims.CancelReadableStream(response.body);
                releaseRequestSignal(controller);
                loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
                loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage})`, formatRequestDetails({
                    retryOfRequestLogID,
                    url: response.url,
                    status: response.status,
                    headers: response.headers,
                    durationMs: headersTime - startTime,
                }));
                return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID, response.headers);
            }
            const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;
            loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
            const errText = await response.text().catch((err) => castToError(err).message);
            const errJSON = safeJSON(errText);
            const errMessage = errJSON ? undefined : errText;
            loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage})`, formatRequestDetails({
                retryOfRequestLogID,
                url: response.url,
                status: response.status,
                headers: response.headers,
                message: errMessage,
                durationMs: Date.now() - startTime,
            }));
            releaseRequestSignal(controller);
            const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
            throw err;
        }
        loggerFor(this).info(responseInfo);
        loggerFor(this).debug(`[${requestLogID}] response start`, formatRequestDetails({
            retryOfRequestLogID,
            url: response.url,
            status: response.status,
            headers: response.headers,
            durationMs: headersTime - startTime,
        }));
        armAbandonmentBackstop(response.body ?? response, controller);
        return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
    }
    getAPIList(path, Page, opts) {
        return this.requestAPIList(Page, opts && 'then' in opts ?
            opts.then((opts) => ({ method: 'get', path, ...opts }))
            : { method: 'get', path, ...opts });
    }
    requestAPIList(Page, options) {
        const request = this.makeRequest(options, null, undefined);
        return new Pagination.PagePromise(this, request, Page);
    }
    async fetchWithTimeout(url, init, ms, controller, requestOptions, logCtx) {
        const { signal, method, ...options } = init || {};
        // Avoid creating a closure over `this`, `init`, or `options` to prevent memory leaks.
        // An arrow function like `() => controller.abort()` captures the surrounding scope,
        // which includes the request body and other large objects. When the user passes a
        // long-lived AbortSignal, the listener prevents those objects from being GC'd for
        // the lifetime of the signal. Using `.bind()` only retains a reference to the
        // controller itself.
        const abort = this._makeAbort(controller);
        if (signal) {
            signal.addEventListener('abort', abort, { once: true });
            registerRequestSignalCleanup(controller, signal, abort);
        }
        const isReadableBody = (globalThis.ReadableStream && options.body instanceof globalThis.ReadableStream) ||
            (typeof options.body === 'object' && options.body !== null && Symbol.asyncIterator in options.body);
        const fetchOptions = {
            signal: controller.signal,
            ...(isReadableBody ? { duplex: 'half' } : {}),
            method: 'GET',
            ...options,
        };
        if (method) {
            // Custom methods like 'patch' need to be uppercased
            // See https://github.com/nodejs/undici/issues/2294
            fetchOptions.method = method.toUpperCase();
        }
        // Arm the timeout around the underlying fetch only, not the middleware
        // chain — middleware can take arbitrarily long (or call `next` more than
        // once), and each inner-fetch invocation gets its own `ms` timer.
        const baseFetch = this.fetch;
        const timedFetch = async (innerUrl, innerInit) => {
            const timeout = setTimeout(abort, ms);
            try {
                return await baseFetch.call(undefined, innerUrl, innerInit);
            }
            finally {
                clearTimeout(timeout);
            }
        };
        // Prepare the request (auth signing and other `prepareRequest` hooks) as
        // the innermost step, after any middleware — including the backend
        // middleware, so it sees exactly what goes over the wire. Runs per
        // inner-fetch invocation, so a request middleware rewrote — or replayed
        // via a second `next()` call — is prepared fresh each time. Preparation is
        // outside the timeout timer, matching its pre-middleware behavior.
        const innerFetch = requestOptions === undefined ? timedFetch : (async (innerUrl, innerInit = {}) => {
            const innerUrlStr = typeof innerUrl === 'string' ? innerUrl
                : innerUrl instanceof URL ? innerUrl.href
                    : innerUrl.url;
            innerInit.headers =
                innerInit.headers instanceof Headers ? innerInit.headers : new Headers(innerInit.headers);
            await this.prepareRequest(innerInit, { url: innerUrlStr, options: requestOptions });
            if (logCtx) {
                loggerFor(this).debug(`[${logCtx.requestLogID}] sending request`, formatRequestDetails({
                    retryOfRequestLogID: logCtx.retryOfRequestLogID,
                    method: innerInit.method,
                    url: innerUrlStr,
                    options: requestOptions,
                    headers: innerInit.headers,
                }));
            }
            return timedFetch(innerUrl, innerInit);
        });
        const requestMiddleware = requestOptions?.middleware;
        const backendMiddleware = this.backendMiddleware();
        const allMiddleware = requestMiddleware?.length || backendMiddleware.length ?
            [...this.middleware, ...(requestMiddleware ?? []), ...backendMiddleware]
            : this.middleware;
        return await wrapFetchWithMiddleware(innerFetch, allMiddleware, requestOptions, this)(url, fetchOptions);
    }
    async shouldRetry(response, options) {
        // Reactive refresh: on a 401 from a request that used the token cache,
        // invalidate and retry once. Only fires when this specific request was
        // bearer-authenticated (not when an apiKey was used) and only once per
        // request — a second 401 after refresh falls through to the normal
        // retry policy below (which treats 4xx as non-retryable).
        const flags = this._authFlags(options);
        if (response.status === 401 &&
            this._authState.tokenCache &&
            flags.usedTokenCache &&
            !flags.didRefreshFor401) {
            flags.didRefreshFor401 = true;
            this._authState.tokenCache.invalidate();
            return true;
        }
        // Note this is not a standard header.
        const shouldRetryHeader = response.headers.get('x-should-retry');
        // If the server explicitly says whether or not to retry, obey.
        if (shouldRetryHeader === 'true')
            return true;
        if (shouldRetryHeader === 'false')
            return false;
        // Retry on request timeouts.
        if (response.status === 408)
            return true;
        // Retry on lock timeouts.
        if (response.status === 409)
            return true;
        // Retry on rate limits.
        if (response.status === 429)
            return true;
        // Retry internal errors.
        if (response.status >= 500)
            return true;
        return false;
    }
    async retryRequest(options, retriesRemaining, requestLogID, responseHeaders) {
        let timeoutMillis;
        // Note the `retry-after-ms` header may not be standard, but is a good idea and we'd like proactive support for it.
        const retryAfterMillisHeader = responseHeaders?.get('retry-after-ms');
        if (retryAfterMillisHeader) {
            const timeoutMs = parseFloat(retryAfterMillisHeader);
            if (!Number.isNaN(timeoutMs)) {
                timeoutMillis = timeoutMs;
            }
        }
        // About the Retry-After header: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
        const retryAfterHeader = responseHeaders?.get('retry-after');
        if (retryAfterHeader && !timeoutMillis) {
            const timeoutSeconds = parseFloat(retryAfterHeader);
            if (!Number.isNaN(timeoutSeconds)) {
                timeoutMillis = timeoutSeconds * 1000;
            }
            else {
                timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
            }
        }
        // If the API asks us to wait a certain amount of time, just do what it
        // says, but otherwise calculate a default
        if (timeoutMillis === undefined) {
            const maxRetries = options.maxRetries ?? this.maxRetries;
            timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
        }
        await sleep(timeoutMillis);
        return this.makeRequest(options, retriesRemaining - 1, requestLogID);
    }
    calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
        const initialRetryDelay = 0.5;
        const maxRetryDelay = 8.0;
        const numRetries = maxRetries - retriesRemaining;
        // Apply exponential backoff, but not more than the max.
        const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
        // Apply some jitter, take up to at most 25 percent of the retry time.
        const jitter = 1 - Math.random() * 0.25;
        return sleepSeconds * jitter * 1000;
    }
    calculateNonstreamingTimeout(maxTokens, maxNonstreamingTokens) {
        const maxTime = 60 * 60 * 1000; // 60 minutes
        const defaultTime = 60 * 10 * 1000; // 10 minutes
        const expectedTime = (maxTime * maxTokens) / 128000;
        if (expectedTime > defaultTime || (maxNonstreamingTokens != null && maxTokens > maxNonstreamingTokens)) {
            throw new Errors.AnthropicError('Streaming is required for operations that may take longer than 10 minutes. See https://github.com/anthropics/anthropic-sdk-typescript#long-requests for more details');
        }
        return defaultTime;
    }
    async buildRequest(inputOptions, { retryCount = 0 } = {}) {
        const options = { ...inputOptions };
        const { method, path, query, defaultBaseURL } = options;
        // Lazy credential resolution may carry a profile-supplied baseURL. Await
        // it before building the request URL so the very first request — and
        // requests on withOptions() clones created before resolution settled —
        // hit the profile's host rather than the hardcoded default.
        if (this._authState.resolution) {
            await this._authState.resolution;
        }
        if (!this._baseURLIsExplicit && this._authState.baseURL && this.baseURL !== this._authState.baseURL) {
            this.baseURL = this._authState.baseURL;
        }
        const url = this.buildURL(path, query, defaultBaseURL);
        if ('timeout' in options)
            validatePositiveInteger('timeout', options.timeout);
        options.timeout = options.timeout ?? this.timeout;
        const { bodyHeaders, body } = this.buildBody({ options });
        const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });
        const req = {
            method,
            headers: reqHeaders,
            ...(options.signal && { signal: options.signal }),
            ...(globalThis.ReadableStream &&
                body instanceof globalThis.ReadableStream && { duplex: 'half' }),
            ...(body && { body }),
            ...(this.fetchOptions ?? {}),
            ...(options.fetchOptions ?? {}),
        };
        return { req, url, timeout: options.timeout };
    }
    async buildHeaders({ options, method, bodyHeaders, retryCount, }) {
        let idempotencyHeaders = {};
        if (this.idempotencyHeader && method !== 'get') {
            if (!options.idempotencyKey)
                options.idempotencyKey = this.defaultIdempotencyKey();
            idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
        }
        const headers = buildHeaders([
            idempotencyHeaders,
            {
                Accept: 'application/json',
                'User-Agent': this.getUserAgent(),
                'X-Stainless-Retry-Count': String(retryCount),
                ...(options.timeout ? { 'X-Stainless-Timeout': String(Math.trunc(options.timeout / 1000)) } : {}),
                ...getPlatformHeaders(),
                ...(this._options.dangerouslyAllowBrowser ?
                    { 'anthropic-dangerous-direct-browser-access': 'true' }
                    : undefined),
                'anthropic-version': '2023-06-01',
            },
            await this.authHeaders(options),
            this._options.defaultHeaders,
            bodyHeaders,
            options.headers,
        ]);
        this.validateHeaders(headers);
        return headers.values;
    }
    _makeAbort(controller) {
        // note: we can't just inline this method inside `fetchWithTimeout()` because then the closure
        //       would capture all request options, and cause a memory leak.
        return () => controller.abort();
    }
    buildBody({ options: { body, headers: rawHeaders } }) {
        if (!body) {
            return { bodyHeaders: undefined, body: undefined };
        }
        const headers = buildHeaders([rawHeaders]);
        if (
        // Pass raw type verbatim
        ArrayBuffer.isView(body) ||
            body instanceof ArrayBuffer ||
            body instanceof DataView ||
            (typeof body === 'string' &&
                // Preserve legacy string encoding behavior for now
                headers.values.has('content-type')) ||
            // `Blob` is superset of `File`
            (globalThis.Blob && body instanceof globalThis.Blob) ||
            // `FormData` -> `multipart/form-data`
            body instanceof FormData ||
            // `URLSearchParams` -> `application/x-www-form-urlencoded`
            body instanceof URLSearchParams ||
            // Send chunked stream (each chunk has own `length`)
            (globalThis.ReadableStream && body instanceof globalThis.ReadableStream)) {
            return { bodyHeaders: undefined, body: body };
        }
        else if (typeof body === 'object' &&
            (Symbol.asyncIterator in body ||
                (Symbol.iterator in body && 'next' in body && typeof body.next === 'function'))) {
            return { bodyHeaders: undefined, body: Shims.ReadableStreamFrom(body) };
        }
        else if (typeof body === 'object' &&
            headers.values.get('content-type') === 'application/x-www-form-urlencoded') {
            return {
                bodyHeaders: { 'content-type': 'application/x-www-form-urlencoded' },
                body: this.stringifyQuery(body),
            };
        }
        else {
            return __classPrivateFieldGet(this, _BaseAnthropic_encoder, "f").call(this, { body, headers });
        }
    }
}
_a = BaseAnthropic, _BaseAnthropic_encoder = new WeakMap(), _BaseAnthropic_instances = new WeakSet(), _BaseAnthropic_baseURLOverridden = function _BaseAnthropic_baseURLOverridden() {
    return this.baseURL !== 'https://api.anthropic.com';
};
BaseAnthropic.Anthropic = _a;
BaseAnthropic.HUMAN_PROMPT = HUMAN_PROMPT;
BaseAnthropic.AI_PROMPT = AI_PROMPT;
BaseAnthropic.DEFAULT_TIMEOUT = 600000; // 10 minutes
BaseAnthropic.AnthropicError = Errors.AnthropicError;
BaseAnthropic.APIError = Errors.APIError;
BaseAnthropic.APIConnectionError = Errors.APIConnectionError;
BaseAnthropic.APIConnectionTimeoutError = Errors.APIConnectionTimeoutError;
BaseAnthropic.APIUserAbortError = Errors.APIUserAbortError;
BaseAnthropic.NotFoundError = Errors.NotFoundError;
BaseAnthropic.ConflictError = Errors.ConflictError;
BaseAnthropic.RateLimitError = Errors.RateLimitError;
BaseAnthropic.BadRequestError = Errors.BadRequestError;
BaseAnthropic.AuthenticationError = Errors.AuthenticationError;
BaseAnthropic.InternalServerError = Errors.InternalServerError;
BaseAnthropic.PermissionDeniedError = Errors.PermissionDeniedError;
BaseAnthropic.UnprocessableEntityError = Errors.UnprocessableEntityError;
BaseAnthropic.toFile = Uploads.toFile;
/**
 * API Client for interfacing with the Anthropic API.
 */
export class Anthropic extends BaseAnthropic {
    constructor() {
        super(...arguments);
        this.completions = new API.Completions(this);
        this.messages = new API.Messages(this);
        this.models = new API.Models(this);
        this.files = new API.Files(this);
        this.skills = new API.Skills(this);
        this.beta = new API.Beta(this);
    }
}
Anthropic.Completions = Completions;
Anthropic.Messages = Messages;
Anthropic.Models = Models;
Anthropic.Files = Files;
Anthropic.Skills = Skills;
Anthropic.Beta = Beta;
//# sourceMappingURL=client.mjs.map