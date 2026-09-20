/**
 * Single source of truth for the `x-stainless-helper` telemetry header — the
 * key, the closed value vocabulary, and per-object helper tagging. The
 * append-don't-clobber merge for the header itself lives in
 * {@link import('../internal/headers').buildHeaders} via `APPEND_HEADERS`.
 */
/**
 * Telemetry header naming the SDK helper(s) a request came from. Always this
 * lowercase form; `buildHeaders` matches it case-insensitively for its append
 * semantics, but a single canonical casing keeps every call site greppable.
 */
export declare const STAINLESS_HELPER_HEADER = "x-stainless-helper";
/** Telemetry header naming the SDK method (e.g. `stream`) in use. */
export declare const STAINLESS_HELPER_METHOD_HEADER = "x-stainless-helper-method";
/**
 * The closed set of helper telemetry tags, shared verbatim across SDKs. A
 * typo at any call site is a type error rather than silently mistagged
 * telemetry. Existing values keep their original spellings — telemetry
 * consumers match on them, so renames lose history. New tags are hyphenated
 * lowercase.
 */
export type StainlessHelperHeaderValue = 'BetaToolRunner' | 'betaZodTool' | 'compaction' | 'environments-work-poller' | 'environments-worker' | 'fallback-refusal-middleware' | 'mcpContent' | 'mcpMessage' | 'mcpResourceToContent' | 'mcpResourceToFile' | 'mcpTool' | 'session-tool-runner';
/**
 * The `{ 'x-stainless-helper': value }` header dict, for passing into
 * `buildHeaders` (which comma-appends `x-stainless-helper` across sources)
 * or as `defaultHeaders`/per-request `headers`.
 */
export declare function helperHeader(value: StainlessHelperHeaderValue): {
    [STAINLESS_HELPER_HEADER]: string;
};
/**
 * Symbol used to mark objects created by SDK helpers for tracking.
 * The value is the helper name (e.g., 'mcpTool', 'betaZodTool').
 */
export declare const SDK_HELPER_SYMBOL: unique symbol;
type StainlessHelperObject = {
    [SDK_HELPER_SYMBOL]: string;
};
export declare function wasCreatedByStainlessHelper(value: unknown): value is StainlessHelperObject;
/**
 * Collects helper names from tools and messages arrays.
 * Returns a deduplicated array of helper names found.
 */
export declare function collectStainlessHelpers(tools: readonly unknown[] | undefined, messages: readonly unknown[] | undefined): string[];
/**
 * Builds x-stainless-helper header value from tools and messages.
 * Returns an empty object if no helpers are found.
 */
export declare function stainlessHelperHeader(tools: readonly unknown[] | undefined, messages: readonly unknown[] | undefined): {
    'x-stainless-helper'?: string;
};
/**
 * Builds x-stainless-helper header value from a file object.
 * Returns an empty object if the file is not marked with a helper.
 */
export declare function stainlessHelperHeaderFromFile(file: unknown): {
    'x-stainless-helper'?: string;
};
export {};
//# sourceMappingURL=stainless-helper-header.d.ts.map