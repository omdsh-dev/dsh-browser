"use strict";
/**
 * Single source of truth for the `x-stainless-helper` telemetry header — the
 * key, the closed value vocabulary, and per-object helper tagging. The
 * append-don't-clobber merge for the header itself lives in
 * {@link import('../internal/headers').buildHeaders} via `APPEND_HEADERS`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDK_HELPER_SYMBOL = exports.STAINLESS_HELPER_METHOD_HEADER = exports.STAINLESS_HELPER_HEADER = void 0;
exports.helperHeader = helperHeader;
exports.wasCreatedByStainlessHelper = wasCreatedByStainlessHelper;
exports.collectStainlessHelpers = collectStainlessHelpers;
exports.stainlessHelperHeader = stainlessHelperHeader;
exports.stainlessHelperHeaderFromFile = stainlessHelperHeaderFromFile;
/**
 * Telemetry header naming the SDK helper(s) a request came from. Always this
 * lowercase form; `buildHeaders` matches it case-insensitively for its append
 * semantics, but a single canonical casing keeps every call site greppable.
 */
exports.STAINLESS_HELPER_HEADER = 'x-stainless-helper';
/** Telemetry header naming the SDK method (e.g. `stream`) in use. */
exports.STAINLESS_HELPER_METHOD_HEADER = 'x-stainless-helper-method';
/**
 * The `{ 'x-stainless-helper': value }` header dict, for passing into
 * `buildHeaders` (which comma-appends `x-stainless-helper` across sources)
 * or as `defaultHeaders`/per-request `headers`.
 */
function helperHeader(value) {
    return { [exports.STAINLESS_HELPER_HEADER]: value };
}
/**
 * Symbol used to mark objects created by SDK helpers for tracking.
 * The value is the helper name (e.g., 'mcpTool', 'betaZodTool').
 */
exports.SDK_HELPER_SYMBOL = Symbol('anthropic.sdk.stainlessHelper');
function wasCreatedByStainlessHelper(value) {
    return typeof value === 'object' && value !== null && exports.SDK_HELPER_SYMBOL in value;
}
/**
 * Collects helper names from tools and messages arrays.
 * Returns a deduplicated array of helper names found.
 */
function collectStainlessHelpers(tools, messages) {
    const helpers = new Set();
    // Collect from tools
    if (tools) {
        for (const tool of tools) {
            if (wasCreatedByStainlessHelper(tool)) {
                helpers.add(tool[exports.SDK_HELPER_SYMBOL]);
            }
        }
    }
    // Collect from messages and their content blocks
    if (messages) {
        for (const message of messages) {
            if (wasCreatedByStainlessHelper(message)) {
                helpers.add(message[exports.SDK_HELPER_SYMBOL]);
            }
            const content = message.content;
            if (Array.isArray(content)) {
                for (const block of content) {
                    if (wasCreatedByStainlessHelper(block)) {
                        helpers.add(block[exports.SDK_HELPER_SYMBOL]);
                    }
                }
            }
        }
    }
    return Array.from(helpers);
}
/**
 * Builds x-stainless-helper header value from tools and messages.
 * Returns an empty object if no helpers are found.
 */
function stainlessHelperHeader(tools, messages) {
    const helpers = collectStainlessHelpers(tools, messages);
    if (helpers.length === 0)
        return {};
    return { [exports.STAINLESS_HELPER_HEADER]: helpers.join(', ') };
}
/**
 * Builds x-stainless-helper header value from a file object.
 * Returns an empty object if the file is not marked with a helper.
 */
function stainlessHelperHeaderFromFile(file) {
    if (wasCreatedByStainlessHelper(file)) {
        return { [exports.STAINLESS_HELPER_HEADER]: file[exports.SDK_HELPER_SYMBOL] };
    }
    return {};
}
//# sourceMappingURL=stainless-helper-header.js.map