import type { RequestInit, RequestInfo } from "./internal/builtin-types.js";
import type { PromiseOrValue, MergedRequestInit, FinalizedRequestInit } from "./internal/types.js";
export type { Logger, LogLevel } from "./internal/utils/log.js";
import * as Opts from "./internal/request-options.js";
import * as Errors from "./core/error.js";
import type { AccessTokenProvider } from "./lib/credentials/types.js";
import type { AnthropicConfig } from "./core/credentials.js";
import { type Middleware } from "./core/middleware.js";
export type { Middleware, MiddlewareContext, MiddlewareNext } from "./core/middleware.js";
export type { APIRequest } from "./core/api.js";
import * as Pagination from "./core/pagination.js";
import { type BidirectionalPageCursorParams, BidirectionalPageCursorResponse, type PageCursorParams, PageCursorResponse, type PageParams, PageResponse, type TokenPageParams, TokenPageResponse } from "./core/pagination.js";
import * as Uploads from "./core/uploads.js";
import * as API from "./resources/index.js";
import { APIPromise } from "./core/api-promise.js";
import { Completion, CompletionCreateParams, CompletionCreateParamsNonStreaming, CompletionCreateParamsStreaming, Completions } from "./resources/completions.js";
import { DeletedFile, FileListParams, FileMetadata, FileMetadataPageCursor, FileUploadParams, Files } from "./resources/files.js";
import { CapabilitySupport, ContextManagementCapability, EffortCapability, ModelCapabilities, ModelInfo, ModelInfosPage, ModelListParams, ModelRetrieveParams, Models, ThinkingCapability, ThinkingTypes } from "./resources/models.js";
import { AnthropicBeta, Beta, BetaAPIError, BetaAuthenticationError, BetaBillingError, BetaCurrency, BetaError, BetaErrorResponse, BetaGatewayTimeoutError, BetaInvalidRequestError, BetaMonetaryAmount, BetaNotFoundError, BetaOverloadedError, BetaPermissionError, BetaRateLimitError } from "./resources/beta/beta.js";
import { Base64ImageSource, Base64PDFSource, BashCodeExecutionOutputBlock, BashCodeExecutionOutputBlockParam, BashCodeExecutionResultBlock, BashCodeExecutionResultBlockParam, BashCodeExecutionToolResultBlock, BashCodeExecutionToolResultBlockParam, BashCodeExecutionToolResultError, BashCodeExecutionToolResultErrorCode, BashCodeExecutionToolResultErrorParam, BrowserCloseTabConfig, BrowserDoubleClickConfig, BrowserFileUploadConfig, BrowserFindConfig, BrowserFormInputConfig, BrowserGetPageTextConfig, BrowserHoldKeyConfig, BrowserHoverConfig, BrowserJavascriptExecConfig, BrowserKeyConfig, BrowserLeftClickConfig, BrowserLeftClickDragConfig, BrowserLeftMouseDownConfig, BrowserLeftMouseUpConfig, BrowserListTabsConfig, BrowserMiddleClickConfig, BrowserMouseMoveConfig, BrowserNavigateConfig, BrowserNewTabConfig, BrowserReadConsoleConfig, BrowserReadNetworkConfig, BrowserReadPageConfig, BrowserRightClickConfig, BrowserScreenshotConfig, BrowserScrollConfig, BrowserScrollToConfig, BrowserStateBlockParam, BrowserStateChange, BrowserStateChangeDownloadCompleted, BrowserStateChangeDownloadFailed, BrowserStateChangeDownloadStarted, BrowserStateChangeTabOpened, BrowserStateTabEntry, BrowserSwitchTabConfig, BrowserToolset20260801, BrowserToolsetConfigs, BrowserTripleClickConfig, BrowserTypeConfig, BrowserWaitConfig, BrowserZoomConfig, CacheControlEphemeral, CacheCreation, CitationCharLocation, CitationCharLocationParam, CitationContentBlockLocation, CitationContentBlockLocationParam, CitationPageLocation, CitationPageLocationParam, CitationSearchResultLocationParam, CitationWebSearchResultLocationParam, CitationsConfig, CitationsConfigParam, CitationsDelta, CitationsSearchResultLocation, CitationsWebSearchResultLocation, CodeExecutionOutputBlock, CodeExecutionOutputBlockParam, CodeExecutionResultBlock, CodeExecutionResultBlockParam, CodeExecutionTool20250522, CodeExecutionTool20250825, CodeExecutionTool20260120, CodeExecutionTool20260521, CodeExecutionToolResultBlock, CodeExecutionToolResultBlockContent, CodeExecutionToolResultBlockParam, CodeExecutionToolResultBlockParamContent, CodeExecutionToolResultError, CodeExecutionToolResultErrorCode, CodeExecutionToolResultErrorParam, ComputerCursorPositionConfig, ComputerDoubleClickConfig, ComputerHoldKeyConfig, ComputerKeyConfig, ComputerLeftClickConfig, ComputerLeftClickDragConfig, ComputerLeftMouseDownConfig, ComputerLeftMouseUpConfig, ComputerMiddleClickConfig, ComputerMouseMoveConfig, ComputerRightClickConfig, ComputerScreenshotConfig, ComputerScrollConfig, ComputerToolset20260801, ComputerToolsetConfigs, ComputerTripleClickConfig, ComputerTypeConfig, ComputerWaitConfig, ComputerZoomConfig, Container, ContainerParams, ContainerSkill, ContainerUploadBlock, ContainerUploadBlockParam, ContentBlock, ContentBlockDeltaEvent, ContentBlockParam, ContentBlockStartEvent, ContentBlockStopEvent, ContentBlockSource, ContentBlockSourceContent, DirectCaller, DocumentBlock, DocumentBlockParam, EncryptedCodeExecutionResultBlock, EncryptedCodeExecutionResultBlockParam, FileDocumentSource, FileImageSource, ImageBlockParam, ImageTransformationsParam, InputJSONDelta, JSONOutputFormat, MemoryTool20250818, Message, MessageStreamParams, MessageCountTokensParams, MessageCountTokensTool, MessageCreateParams, MessageCreateParamsContainer, MessageCreateParamsNonStreaming, MessageCreateParamsStreaming, MessageDeltaEvent, MessageDeltaUsage, MessageParam, MessageStartEvent, MessageStopEvent, MessageStreamEvent, MessageTokensCount, Messages, Metadata, Model, OutputConfig, OutputTokensDetails, PlainTextSource, RawContentBlockDelta, RawContentBlockDeltaEvent, RawContentBlockStartEvent, RawContentBlockStopEvent, RawMessageDeltaEvent, RawMessageStartEvent, RawMessageStopEvent, RawMessageStreamEvent, RedactedThinkingBlock, RedactedThinkingBlockParam, RefusalStopDetails, SearchResultBlockParam, ServerToolCaller, ServerToolCaller20260120, ServerToolUsage, ServerToolUseBlock, ServerToolUseBlockParam, SignatureDelta, SkillParams, StopReason, TextBlock, TextBlockParam, TextCitation, TextCitationParam, TextDelta, TextEditorCodeExecutionCreateResultBlock, TextEditorCodeExecutionCreateResultBlockParam, TextEditorCodeExecutionStrReplaceResultBlock, TextEditorCodeExecutionStrReplaceResultBlockParam, TextEditorCodeExecutionToolResultBlock, TextEditorCodeExecutionToolResultBlockParam, TextEditorCodeExecutionToolResultError, TextEditorCodeExecutionToolResultErrorCode, TextEditorCodeExecutionToolResultErrorParam, TextEditorCodeExecutionViewResultBlock, TextEditorCodeExecutionViewResultBlockParam, ThinkingBlock, ThinkingBlockParam, ThinkingConfigAdaptive, ThinkingConfigDisabled, ThinkingConfigEnabled, ThinkingConfigParam, ThinkingDelta, Tool, ToolBash20250124, ToolChoice, ToolChoiceAny, ToolChoiceAuto, ToolChoiceNone, ToolChoiceTool, ToolReferenceBlock, ToolReferenceBlockParam, ToolResultBlockParam, ToolSearchToolBm25_20251119, ToolSearchToolRegex20251119, ToolSearchToolResultBlock, ToolSearchToolResultBlockParam, ToolSearchToolResultError, ToolSearchToolResultErrorCode, ToolSearchToolResultErrorParam, ToolSearchToolSearchResultBlock, ToolSearchToolSearchResultBlockParam, ToolTextEditor20250124, ToolTextEditor20250429, ToolTextEditor20250728, ToolUnion, ToolUseBlock, ToolUseBlockParam, URLImageSource, URLPDFSource, Usage, UserLocation, WebFetchBlock, WebFetchBlockParam, WebFetchTool20250910, WebFetchTool20260209, WebFetchTool20260309, WebFetchTool20260318, WebFetchToolResultBlock, WebFetchToolResultBlockParam, WebFetchToolResultErrorBlock, WebFetchToolResultErrorBlockParam, WebFetchToolResultErrorCode, WebSearchResultBlock, WebSearchResultBlockParam, WebSearchTool20250305, WebSearchTool20260209, WebSearchTool20260318, WebSearchToolRequestError, WebSearchToolResultBlock, WebSearchToolResultBlockContent, WebSearchToolResultBlockParam, WebSearchToolResultBlockParamContent, WebSearchToolResultError, WebSearchToolResultErrorCode } from "./resources/messages/messages.js";
import { DeletedSkill, Skill, SkillCreateParams, SkillListParams, SkillSource, Skills, SkillsPageCursor } from "./resources/skills/skills.js";
import { type Fetch } from "./internal/builtin-types.js";
import { HeadersLike, NullableHeaders } from "./internal/headers.js";
import { FinalRequestOptions, RequestOptions } from "./internal/request-options.js";
import { type LogLevel, type Logger } from "./internal/utils/log.js";
export type ApiKeySetter = () => Promise<string>;
export interface ClientOptions {
    /**
     * API key used for authentication.
     *
     * - Accepts either a static string or an async function that resolves to a string.
     * - Defaults to process.env['ANTHROPIC_API_KEY'].
     * - When a function is provided, it is invoked before each request so you can rotate
     *   or refresh credentials at runtime.
     * - The function must return a non-empty string; otherwise an AnthropicError is thrown.
     * - If the function throws, the error is wrapped in an AnthropicError with the original
     *   error available as `cause`.
     */
    apiKey?: string | ApiKeySetter | null | undefined;
    /**
     * Defaults to process.env['ANTHROPIC_AUTH_TOKEN'].
     */
    authToken?: string | null | undefined;
    /**
     * An {@link AccessTokenProvider} for OAuth/workload-identity authentication.
     *
     * When set, the provider is wrapped in a {@link TokenCache} and used for
     * Bearer token auth on every request. Takes precedence over `authToken`
     * but not `apiKey`.
     *
     * If omitted (and no `apiKey` or `authToken` is provided), the client
     * automatically resolves credentials from config files or environment
     * variables on the first request.
     */
    credentials?: AccessTokenProvider | null | undefined;
    /**
     * An {@link AnthropicConfig} object to resolve credentials from directly,
     * bypassing config-file and environment-variable lookup. This is the
     * TypeScript equivalent of Go's `option.WithConfig(cfg)`.
     *
     * Ignored when `credentials` is set. For `oidc_federation`, the SDK
     * performs the jwt-bearer exchange in-process; for `user_oauth`,
     * `authentication.credentials_path` must point at the credentials file.
     */
    config?: AnthropicConfig | null | undefined;
    /**
     * Name of a profile to load from `<config_dir>/configs/<profile>.json`.
     *
     * Equivalent to setting the `ANTHROPIC_PROFILE` environment variable, but
     * scoped to this client instance. As an explicit constructor argument it
     * takes precedence over `ANTHROPIC_API_KEY` / `ANTHROPIC_AUTH_TOKEN` in the
     * environment. Mutually exclusive with `credentials` and `config`.
     */
    profile?: string | null | undefined;
    /**
     * Defaults to process.env['ANTHROPIC_WEBHOOK_SIGNING_KEY'].
     */
    webhookKey?: string | null | undefined;
    /**
     * Override the default base URL for the API, e.g., "https://api.example.com/v2/"
     *
     * Defaults to process.env['ANTHROPIC_BASE_URL'].
     */
    baseURL?: string | null | undefined;
    /**
     * The maximum amount of time (in milliseconds) that the client should wait for a response
     * from the server before timing out a single request.
     *
     * Note that request timeouts are retried by default, so in a worst-case scenario you may wait
     * much longer than this timeout before the promise succeeds or fails.
     *
     * @unit milliseconds
     */
    timeout?: number | undefined;
    /**
     * Additional `RequestInit` options to be passed to `fetch` calls.
     * Properties will be overridden by per-request `fetchOptions`.
     */
    fetchOptions?: MergedRequestInit | undefined;
    /**
     * Specify a custom `fetch` function implementation.
     *
     * If not provided, we expect that `fetch` is defined globally.
     */
    fetch?: Fetch | undefined;
    /**
     * {@link Middleware} functions that wrap every HTTP request made by the
     * client.
     *
     * Middleware runs per HTTP attempt, including retries. It observes the
     * canonical Anthropic-shaped request and response on every backend: on
     * clients for third-party backends (Bedrock, Vertex, Foundry), the
     * backend's URL/body rewriting, request signing, and response
     * normalization happen inside `next`.
     */
    middleware?: ReadonlyArray<Middleware> | undefined;
    /**
     * The maximum number of times that the client will retry a request in case of a
     * temporary failure, like a network error or a 5XX error from the server.
     *
     * @default 2
     */
    maxRetries?: number | undefined;
    /**
     * Default headers to include with every request to the API.
     *
     * These can be removed in individual requests by explicitly setting the
     * header to `null` in request options.
     */
    defaultHeaders?: HeadersLike | undefined;
    /**
     * Default query parameters to include with every request to the API.
     *
     * These can be removed in individual requests by explicitly setting the
     * param to `undefined` in request options.
     */
    defaultQuery?: Record<string, string | undefined> | undefined;
    /**
     * By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
     * Only set this option to `true` if you understand the risks and have appropriate mitigations in place.
     */
    dangerouslyAllowBrowser?: boolean | undefined;
    /**
     * Set the log level.
     *
     * Defaults to process.env['ANTHROPIC_LOG'] or 'warn' if it isn't set.
     */
    logLevel?: LogLevel | undefined;
    /**
     * Set the logger.
     *
     * Defaults to globalThis.console.
     */
    logger?: Logger | undefined;
}
export declare const HUMAN_PROMPT = "\\n\\nHuman:";
export declare const AI_PROMPT = "\\n\\nAssistant:";
/**
 * Base class for Anthropic API clients.
 */
export declare class BaseAnthropic {
    #private;
    apiKey: string | null;
    authToken: string | null;
    webhookKey: string | null;
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
    get credentials(): AccessTokenProvider | null;
    private _authState;
    /**
     * Whether `baseURL` was chosen by the caller (constructor arg or env var)
     * rather than derived. Non-explicit base URLs may be replaced — by a
     * profile-supplied host, or by re-derivation in `withOptions()` clones.
     * Subclasses that derive their own base URL should correct this after
     * `super()`, since the base constructor can't tell a derived value apart.
     */
    protected _baseURLIsExplicit: boolean;
    private _requestAuthFlags;
    baseURL: string;
    maxRetries: number;
    timeout: number;
    logger: Logger;
    logLevel: LogLevel | undefined;
    fetchOptions: MergedRequestInit | undefined;
    middleware: ReadonlyArray<Middleware>;
    private fetch;
    protected idempotencyHeader?: string;
    protected _options: ClientOptions;
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
    constructor({ baseURL, apiKey, authToken, webhookKey, ...opts }?: ClientOptions);
    /**
     * Whether to lazily resolve auth from the default credential chain when no
     * explicit auth is configured. Called once from the constructor, so
     * overrides must not depend on subclass instance state. Subclasses that
     * bring their own auth scheme return false so unrelated local credentials
     * are never resolved or allowed to supply a base URL.
     */
    protected _shouldResolveDefaultCredentials(): boolean;
    /**
     * Stores a profile/config-supplied base URL on the shared auth state and, if
     * the caller did not pin `baseURL` via constructor option or env, adopts it
     * as this client's outbound API host. Precedence: ctor opt > env > profile >
     * hardcoded default.
     */
    private _applyCredentialBaseURL;
    /**
     * Options bag passed into the credential chain. `baseURL` here is only the
     * fallback host for the token-exchange POST when the config itself omits
     * `base_url`; the chain returns the config's own `base_url` (if any) on
     * {@link CredentialResult.baseURL}, which {@link _applyCredentialBaseURL}
     * then adopts for outbound API requests. The two are deliberately decoupled
     * so this fallback never round-trips into precedence.
     */
    private _credentialResolverOptions;
    /**
     * A `Fetch` for first-party credential token-exchange requests (OIDC
     * federation jwt-bearer grants, user-OAuth refresh grants) that routes
     * through this client's middleware chain, so middleware observes token
     * traffic like any other request. Only client-level middleware applies:
     * a minted token is shared across requests, so attributing the exchange
     * to any one request's per-request middleware would be arbitrary. For the
     * same reason, `ctx.options` is undefined for these requests.
     */
    private _credentialsFetch;
    private _makeTokenCache;
    /**
     * Create a new client instance re-using the same options given to the current client with optional overriding.
     */
    withOptions(options: Partial<ClientOptions>): this;
    /**
     * Lazily resolves credentials from config files or environment variables.
     * Called once from the constructor when no explicit auth is provided, or
     * when an explicit `profile` was passed (in which case a missing/unresolved
     * profile is surfaced as an error instead of falling through to "no auth").
     * The returned promise is stored and awaited on the first request.
     */
    private _resolveDefaultCredentials;
    protected defaultQuery(): Record<string, string | undefined> | undefined;
    protected validateHeaders({ values, nulls }: NullableHeaders): void;
    private _authFlags;
    protected authHeaders(opts: FinalRequestOptions): Promise<NullableHeaders | undefined>;
    protected apiKeyAuth(opts: FinalRequestOptions): Promise<NullableHeaders | undefined>;
    protected bearerAuth(opts: FinalRequestOptions): Promise<NullableHeaders | undefined>;
    protected stringifyQuery(query: object | Record<string, unknown>): string;
    protected getUserAgent(): string;
    protected defaultIdempotencyKey(): string;
    protected makeStatusError(status: number, error: Object, message: string | undefined, headers: Headers): Errors.APIError;
    buildURL(path: string, query: Record<string, unknown> | null | undefined, defaultBaseURL?: string | undefined): string;
    _calculateNonstreamingTimeout(maxTokens: number): number;
    /**
     * Used as a callback for mutating the given `FinalRequestOptions` object.
     */
    protected prepareOptions(options: FinalRequestOptions): Promise<void>;
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
    protected prepareRequest(request: RequestInit, { url, options }: {
        url: string;
        options: FinalRequestOptions;
    }): Promise<void>;
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
    protected backendMiddleware(): ReadonlyArray<Middleware>;
    get<Rsp>(path: string, opts?: PromiseOrValue<RequestOptions>): APIPromise<Rsp>;
    post<Rsp>(path: string, opts?: PromiseOrValue<RequestOptions>): APIPromise<Rsp>;
    patch<Rsp>(path: string, opts?: PromiseOrValue<RequestOptions>): APIPromise<Rsp>;
    put<Rsp>(path: string, opts?: PromiseOrValue<RequestOptions>): APIPromise<Rsp>;
    delete<Rsp>(path: string, opts?: PromiseOrValue<RequestOptions>): APIPromise<Rsp>;
    private methodRequest;
    request<Rsp>(options: PromiseOrValue<FinalRequestOptions>, remainingRetries?: number | null): APIPromise<Rsp>;
    private makeRequest;
    getAPIList<Item, PageClass extends Pagination.AbstractPage<Item> = Pagination.AbstractPage<Item>>(path: string, Page: new (...args: any[]) => PageClass, opts?: PromiseOrValue<RequestOptions>): Pagination.PagePromise<PageClass, Item>;
    requestAPIList<Item = unknown, PageClass extends Pagination.AbstractPage<Item> = Pagination.AbstractPage<Item>>(Page: new (...args: ConstructorParameters<typeof Pagination.AbstractPage>) => PageClass, options: PromiseOrValue<FinalRequestOptions>): Pagination.PagePromise<PageClass, Item>;
    fetchWithTimeout(url: RequestInfo, init: RequestInit | undefined, ms: number, controller: AbortController, requestOptions?: FinalRequestOptions | undefined, logCtx?: {
        requestLogID: string;
        retryOfRequestLogID?: string | undefined;
    } | undefined): Promise<Response>;
    private shouldRetry;
    private retryRequest;
    private calculateDefaultRetryTimeoutMillis;
    calculateNonstreamingTimeout(maxTokens: number, maxNonstreamingTokens?: number): number;
    buildRequest(inputOptions: FinalRequestOptions, { retryCount }?: {
        retryCount?: number;
    }): Promise<{
        req: FinalizedRequestInit;
        url: string;
        timeout: number;
    }>;
    private buildHeaders;
    private _makeAbort;
    private buildBody;
    static Anthropic: typeof BaseAnthropic;
    static HUMAN_PROMPT: string;
    static AI_PROMPT: string;
    static DEFAULT_TIMEOUT: number;
    static AnthropicError: typeof Errors.AnthropicError;
    static APIError: typeof Errors.APIError;
    static APIConnectionError: typeof Errors.APIConnectionError;
    static APIConnectionTimeoutError: typeof Errors.APIConnectionTimeoutError;
    static APIUserAbortError: typeof Errors.APIUserAbortError;
    static NotFoundError: typeof Errors.NotFoundError;
    static ConflictError: typeof Errors.ConflictError;
    static RateLimitError: typeof Errors.RateLimitError;
    static BadRequestError: typeof Errors.BadRequestError;
    static AuthenticationError: typeof Errors.AuthenticationError;
    static InternalServerError: typeof Errors.InternalServerError;
    static PermissionDeniedError: typeof Errors.PermissionDeniedError;
    static UnprocessableEntityError: typeof Errors.UnprocessableEntityError;
    static toFile: typeof Uploads.toFile;
}
/**
 * API Client for interfacing with the Anthropic API.
 */
export declare class Anthropic extends BaseAnthropic {
    completions: API.Completions;
    messages: API.Messages;
    models: API.Models;
    files: API.Files;
    skills: API.Skills;
    beta: API.Beta;
}
export declare namespace Anthropic {
    export type RequestOptions = Opts.RequestOptions;
    export type FinalRequestOptions = Opts.FinalRequestOptions;
    export type { ApiKeySetter };
    export import Page = Pagination.Page;
    export { type PageParams as PageParams, type PageResponse as PageResponse };
    export import TokenPage = Pagination.TokenPage;
    export { type TokenPageParams as TokenPageParams, type TokenPageResponse as TokenPageResponse };
    export import PageCursor = Pagination.PageCursor;
    export { type PageCursorParams as PageCursorParams, type PageCursorResponse as PageCursorResponse };
    export import BidirectionalPageCursor = Pagination.BidirectionalPageCursor;
    export { type BidirectionalPageCursorParams as BidirectionalPageCursorParams, type BidirectionalPageCursorResponse as BidirectionalPageCursorResponse, };
    export { Completions as Completions, type Completion as Completion, type CompletionCreateParams as CompletionCreateParams, type CompletionCreateParamsNonStreaming as CompletionCreateParamsNonStreaming, type CompletionCreateParamsStreaming as CompletionCreateParamsStreaming, };
    export { Messages as Messages, type Base64ImageSource as Base64ImageSource, type Base64PDFSource as Base64PDFSource, type BashCodeExecutionOutputBlock as BashCodeExecutionOutputBlock, type BashCodeExecutionOutputBlockParam as BashCodeExecutionOutputBlockParam, type BashCodeExecutionResultBlock as BashCodeExecutionResultBlock, type BashCodeExecutionResultBlockParam as BashCodeExecutionResultBlockParam, type BashCodeExecutionToolResultBlock as BashCodeExecutionToolResultBlock, type BashCodeExecutionToolResultBlockParam as BashCodeExecutionToolResultBlockParam, type BashCodeExecutionToolResultError as BashCodeExecutionToolResultError, type BashCodeExecutionToolResultErrorCode as BashCodeExecutionToolResultErrorCode, type BashCodeExecutionToolResultErrorParam as BashCodeExecutionToolResultErrorParam, type BrowserCloseTabConfig as BrowserCloseTabConfig, type BrowserDoubleClickConfig as BrowserDoubleClickConfig, type BrowserFileUploadConfig as BrowserFileUploadConfig, type BrowserFindConfig as BrowserFindConfig, type BrowserFormInputConfig as BrowserFormInputConfig, type BrowserGetPageTextConfig as BrowserGetPageTextConfig, type BrowserHoldKeyConfig as BrowserHoldKeyConfig, type BrowserHoverConfig as BrowserHoverConfig, type BrowserJavascriptExecConfig as BrowserJavascriptExecConfig, type BrowserKeyConfig as BrowserKeyConfig, type BrowserLeftClickConfig as BrowserLeftClickConfig, type BrowserLeftClickDragConfig as BrowserLeftClickDragConfig, type BrowserLeftMouseDownConfig as BrowserLeftMouseDownConfig, type BrowserLeftMouseUpConfig as BrowserLeftMouseUpConfig, type BrowserListTabsConfig as BrowserListTabsConfig, type BrowserMiddleClickConfig as BrowserMiddleClickConfig, type BrowserMouseMoveConfig as BrowserMouseMoveConfig, type BrowserNavigateConfig as BrowserNavigateConfig, type BrowserNewTabConfig as BrowserNewTabConfig, type BrowserReadConsoleConfig as BrowserReadConsoleConfig, type BrowserReadNetworkConfig as BrowserReadNetworkConfig, type BrowserReadPageConfig as BrowserReadPageConfig, type BrowserRightClickConfig as BrowserRightClickConfig, type BrowserScreenshotConfig as BrowserScreenshotConfig, type BrowserScrollConfig as BrowserScrollConfig, type BrowserScrollToConfig as BrowserScrollToConfig, type BrowserStateBlockParam as BrowserStateBlockParam, type BrowserStateChange as BrowserStateChange, type BrowserStateChangeDownloadCompleted as BrowserStateChangeDownloadCompleted, type BrowserStateChangeDownloadFailed as BrowserStateChangeDownloadFailed, type BrowserStateChangeDownloadStarted as BrowserStateChangeDownloadStarted, type BrowserStateChangeTabOpened as BrowserStateChangeTabOpened, type BrowserStateTabEntry as BrowserStateTabEntry, type BrowserSwitchTabConfig as BrowserSwitchTabConfig, type BrowserToolset20260801 as BrowserToolset20260801, type BrowserToolsetConfigs as BrowserToolsetConfigs, type BrowserTripleClickConfig as BrowserTripleClickConfig, type BrowserTypeConfig as BrowserTypeConfig, type BrowserWaitConfig as BrowserWaitConfig, type BrowserZoomConfig as BrowserZoomConfig, type CacheControlEphemeral as CacheControlEphemeral, type CacheCreation as CacheCreation, type CitationCharLocation as CitationCharLocation, type CitationCharLocationParam as CitationCharLocationParam, type CitationContentBlockLocation as CitationContentBlockLocation, type CitationContentBlockLocationParam as CitationContentBlockLocationParam, type CitationPageLocation as CitationPageLocation, type CitationPageLocationParam as CitationPageLocationParam, type CitationSearchResultLocationParam as CitationSearchResultLocationParam, type CitationWebSearchResultLocationParam as CitationWebSearchResultLocationParam, type CitationsConfig as CitationsConfig, type CitationsConfigParam as CitationsConfigParam, type CitationsDelta as CitationsDelta, type CitationsSearchResultLocation as CitationsSearchResultLocation, type CitationsWebSearchResultLocation as CitationsWebSearchResultLocation, type CodeExecutionOutputBlock as CodeExecutionOutputBlock, type CodeExecutionOutputBlockParam as CodeExecutionOutputBlockParam, type CodeExecutionResultBlock as CodeExecutionResultBlock, type CodeExecutionResultBlockParam as CodeExecutionResultBlockParam, type CodeExecutionTool20250522 as CodeExecutionTool20250522, type CodeExecutionTool20250825 as CodeExecutionTool20250825, type CodeExecutionTool20260120 as CodeExecutionTool20260120, type CodeExecutionTool20260521 as CodeExecutionTool20260521, type CodeExecutionToolResultBlock as CodeExecutionToolResultBlock, type CodeExecutionToolResultBlockContent as CodeExecutionToolResultBlockContent, type CodeExecutionToolResultBlockParam as CodeExecutionToolResultBlockParam, type CodeExecutionToolResultBlockParamContent as CodeExecutionToolResultBlockParamContent, type CodeExecutionToolResultError as CodeExecutionToolResultError, type CodeExecutionToolResultErrorCode as CodeExecutionToolResultErrorCode, type CodeExecutionToolResultErrorParam as CodeExecutionToolResultErrorParam, type ComputerCursorPositionConfig as ComputerCursorPositionConfig, type ComputerDoubleClickConfig as ComputerDoubleClickConfig, type ComputerHoldKeyConfig as ComputerHoldKeyConfig, type ComputerKeyConfig as ComputerKeyConfig, type ComputerLeftClickConfig as ComputerLeftClickConfig, type ComputerLeftClickDragConfig as ComputerLeftClickDragConfig, type ComputerLeftMouseDownConfig as ComputerLeftMouseDownConfig, type ComputerLeftMouseUpConfig as ComputerLeftMouseUpConfig, type ComputerMiddleClickConfig as ComputerMiddleClickConfig, type ComputerMouseMoveConfig as ComputerMouseMoveConfig, type ComputerRightClickConfig as ComputerRightClickConfig, type ComputerScreenshotConfig as ComputerScreenshotConfig, type ComputerScrollConfig as ComputerScrollConfig, type ComputerToolset20260801 as ComputerToolset20260801, type ComputerToolsetConfigs as ComputerToolsetConfigs, type ComputerTripleClickConfig as ComputerTripleClickConfig, type ComputerTypeConfig as ComputerTypeConfig, type ComputerWaitConfig as ComputerWaitConfig, type ComputerZoomConfig as ComputerZoomConfig, type Container as Container, type ContainerParams as ContainerParams, type ContainerSkill as ContainerSkill, type ContainerUploadBlock as ContainerUploadBlock, type ContainerUploadBlockParam as ContainerUploadBlockParam, type ContentBlock as ContentBlock, type ContentBlockDeltaEvent as ContentBlockDeltaEvent, type ContentBlockParam as ContentBlockParam, type ContentBlockStartEvent as ContentBlockStartEvent, type ContentBlockStopEvent as ContentBlockStopEvent, type ContentBlockSource as ContentBlockSource, type ContentBlockSourceContent as ContentBlockSourceContent, type DirectCaller as DirectCaller, type DocumentBlock as DocumentBlock, type DocumentBlockParam as DocumentBlockParam, type EncryptedCodeExecutionResultBlock as EncryptedCodeExecutionResultBlock, type EncryptedCodeExecutionResultBlockParam as EncryptedCodeExecutionResultBlockParam, type FileDocumentSource as FileDocumentSource, type FileImageSource as FileImageSource, type ImageBlockParam as ImageBlockParam, type ImageTransformationsParam as ImageTransformationsParam, type InputJSONDelta as InputJSONDelta, type JSONOutputFormat as JSONOutputFormat, type MemoryTool20250818 as MemoryTool20250818, type Message as Message, type MessageCountTokensTool as MessageCountTokensTool, type MessageCreateParamsContainer as MessageCreateParamsContainer, type MessageDeltaEvent as MessageDeltaEvent, type MessageDeltaUsage as MessageDeltaUsage, type MessageParam as MessageParam, type MessageStartEvent as MessageStartEvent, type MessageStopEvent as MessageStopEvent, type MessageStreamEvent as MessageStreamEvent, type MessageTokensCount as MessageTokensCount, type Metadata as Metadata, type Model as Model, type OutputConfig as OutputConfig, type OutputTokensDetails as OutputTokensDetails, type PlainTextSource as PlainTextSource, type RawContentBlockDelta as RawContentBlockDelta, type RawContentBlockDeltaEvent as RawContentBlockDeltaEvent, type RawContentBlockStartEvent as RawContentBlockStartEvent, type RawContentBlockStopEvent as RawContentBlockStopEvent, type RawMessageDeltaEvent as RawMessageDeltaEvent, type RawMessageStartEvent as RawMessageStartEvent, type RawMessageStopEvent as RawMessageStopEvent, type RawMessageStreamEvent as RawMessageStreamEvent, type RedactedThinkingBlock as RedactedThinkingBlock, type RedactedThinkingBlockParam as RedactedThinkingBlockParam, type RefusalStopDetails as RefusalStopDetails, type SearchResultBlockParam as SearchResultBlockParam, type ServerToolCaller as ServerToolCaller, type ServerToolCaller20260120 as ServerToolCaller20260120, type ServerToolUsage as ServerToolUsage, type ServerToolUseBlock as ServerToolUseBlock, type ServerToolUseBlockParam as ServerToolUseBlockParam, type SignatureDelta as SignatureDelta, type SkillParams as SkillParams, type StopReason as StopReason, type TextBlock as TextBlock, type TextBlockParam as TextBlockParam, type TextCitation as TextCitation, type TextCitationParam as TextCitationParam, type TextDelta as TextDelta, type TextEditorCodeExecutionCreateResultBlock as TextEditorCodeExecutionCreateResultBlock, type TextEditorCodeExecutionCreateResultBlockParam as TextEditorCodeExecutionCreateResultBlockParam, type TextEditorCodeExecutionStrReplaceResultBlock as TextEditorCodeExecutionStrReplaceResultBlock, type TextEditorCodeExecutionStrReplaceResultBlockParam as TextEditorCodeExecutionStrReplaceResultBlockParam, type TextEditorCodeExecutionToolResultBlock as TextEditorCodeExecutionToolResultBlock, type TextEditorCodeExecutionToolResultBlockParam as TextEditorCodeExecutionToolResultBlockParam, type TextEditorCodeExecutionToolResultError as TextEditorCodeExecutionToolResultError, type TextEditorCodeExecutionToolResultErrorCode as TextEditorCodeExecutionToolResultErrorCode, type TextEditorCodeExecutionToolResultErrorParam as TextEditorCodeExecutionToolResultErrorParam, type TextEditorCodeExecutionViewResultBlock as TextEditorCodeExecutionViewResultBlock, type TextEditorCodeExecutionViewResultBlockParam as TextEditorCodeExecutionViewResultBlockParam, type ThinkingBlock as ThinkingBlock, type ThinkingBlockParam as ThinkingBlockParam, type ThinkingConfigAdaptive as ThinkingConfigAdaptive, type ThinkingConfigDisabled as ThinkingConfigDisabled, type ThinkingConfigEnabled as ThinkingConfigEnabled, type ThinkingConfigParam as ThinkingConfigParam, type ThinkingDelta as ThinkingDelta, type Tool as Tool, type ToolBash20250124 as ToolBash20250124, type ToolChoice as ToolChoice, type ToolChoiceAny as ToolChoiceAny, type ToolChoiceAuto as ToolChoiceAuto, type ToolChoiceNone as ToolChoiceNone, type ToolChoiceTool as ToolChoiceTool, type ToolReferenceBlock as ToolReferenceBlock, type ToolReferenceBlockParam as ToolReferenceBlockParam, type ToolResultBlockParam as ToolResultBlockParam, type ToolSearchToolBm25_20251119 as ToolSearchToolBm25_20251119, type ToolSearchToolRegex20251119 as ToolSearchToolRegex20251119, type ToolSearchToolResultBlock as ToolSearchToolResultBlock, type ToolSearchToolResultBlockParam as ToolSearchToolResultBlockParam, type ToolSearchToolResultError as ToolSearchToolResultError, type ToolSearchToolResultErrorCode as ToolSearchToolResultErrorCode, type ToolSearchToolResultErrorParam as ToolSearchToolResultErrorParam, type ToolSearchToolSearchResultBlock as ToolSearchToolSearchResultBlock, type ToolSearchToolSearchResultBlockParam as ToolSearchToolSearchResultBlockParam, type ToolTextEditor20250124 as ToolTextEditor20250124, type ToolTextEditor20250429 as ToolTextEditor20250429, type ToolTextEditor20250728 as ToolTextEditor20250728, type ToolUnion as ToolUnion, type ToolUseBlock as ToolUseBlock, type ToolUseBlockParam as ToolUseBlockParam, type URLImageSource as URLImageSource, type URLPDFSource as URLPDFSource, type Usage as Usage, type UserLocation as UserLocation, type WebFetchBlock as WebFetchBlock, type WebFetchBlockParam as WebFetchBlockParam, type WebFetchTool20250910 as WebFetchTool20250910, type WebFetchTool20260209 as WebFetchTool20260209, type WebFetchTool20260309 as WebFetchTool20260309, type WebFetchTool20260318 as WebFetchTool20260318, type WebFetchToolResultBlock as WebFetchToolResultBlock, type WebFetchToolResultBlockParam as WebFetchToolResultBlockParam, type WebFetchToolResultErrorBlock as WebFetchToolResultErrorBlock, type WebFetchToolResultErrorBlockParam as WebFetchToolResultErrorBlockParam, type WebFetchToolResultErrorCode as WebFetchToolResultErrorCode, type WebSearchResultBlock as WebSearchResultBlock, type WebSearchResultBlockParam as WebSearchResultBlockParam, type WebSearchTool20250305 as WebSearchTool20250305, type WebSearchTool20260209 as WebSearchTool20260209, type WebSearchTool20260318 as WebSearchTool20260318, type WebSearchToolRequestError as WebSearchToolRequestError, type WebSearchToolResultBlock as WebSearchToolResultBlock, type WebSearchToolResultBlockContent as WebSearchToolResultBlockContent, type WebSearchToolResultBlockParam as WebSearchToolResultBlockParam, type WebSearchToolResultBlockParamContent as WebSearchToolResultBlockParamContent, type WebSearchToolResultError as WebSearchToolResultError, type WebSearchToolResultErrorCode as WebSearchToolResultErrorCode, type MessageCreateParams as MessageCreateParams, type MessageCreateParamsNonStreaming as MessageCreateParamsNonStreaming, type MessageCreateParamsStreaming as MessageCreateParamsStreaming, type MessageStreamParams as MessageStreamParams, type MessageCountTokensParams as MessageCountTokensParams, };
    export { Models as Models, type CapabilitySupport as CapabilitySupport, type ContextManagementCapability as ContextManagementCapability, type EffortCapability as EffortCapability, type ModelCapabilities as ModelCapabilities, type ModelInfo as ModelInfo, type ThinkingCapability as ThinkingCapability, type ThinkingTypes as ThinkingTypes, type ModelInfosPage as ModelInfosPage, type ModelRetrieveParams as ModelRetrieveParams, type ModelListParams as ModelListParams, };
    export { Files as Files, type DeletedFile as DeletedFile, type FileMetadata as FileMetadata, type FileMetadataPageCursor as FileMetadataPageCursor, type FileListParams as FileListParams, type FileUploadParams as FileUploadParams, };
    export { Skills as Skills, type DeletedSkill as DeletedSkill, type Skill as Skill, type SkillSource as SkillSource, type SkillsPageCursor as SkillsPageCursor, type SkillCreateParams as SkillCreateParams, type SkillListParams as SkillListParams, };
    export { Beta as Beta, type AnthropicBeta as AnthropicBeta, type BetaAPIError as BetaAPIError, type BetaAuthenticationError as BetaAuthenticationError, type BetaBillingError as BetaBillingError, type BetaCurrency as BetaCurrency, type BetaError as BetaError, type BetaErrorResponse as BetaErrorResponse, type BetaGatewayTimeoutError as BetaGatewayTimeoutError, type BetaInvalidRequestError as BetaInvalidRequestError, type BetaMonetaryAmount as BetaMonetaryAmount, type BetaNotFoundError as BetaNotFoundError, type BetaOverloadedError as BetaOverloadedError, type BetaPermissionError as BetaPermissionError, type BetaRateLimitError as BetaRateLimitError, };
    export type APIErrorObject = API.APIErrorObject;
    export type AuthenticationError = API.AuthenticationError;
    export type BillingError = API.BillingError;
    export type ErrorObject = API.ErrorObject;
    export type ErrorResponse = API.ErrorResponse;
    export type ErrorType = API.ErrorType;
    export type GatewayTimeoutError = API.GatewayTimeoutError;
    export type InvalidRequestError = API.InvalidRequestError;
    export type NotFoundError = API.NotFoundError;
    export type OverloadedError = API.OverloadedError;
    export type PermissionError = API.PermissionError;
    export type RateLimitError = API.RateLimitError;
}
//# sourceMappingURL=client.d.ts.map