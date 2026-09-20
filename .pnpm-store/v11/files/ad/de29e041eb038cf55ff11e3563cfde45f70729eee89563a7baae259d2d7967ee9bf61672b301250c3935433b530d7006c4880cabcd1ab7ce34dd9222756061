"use strict";
/**
 * The memory sync cadence, split out of `memories.ts` so runtime-agnostic
 * callers (the environment worker) can validate an interval up front without
 * reaching into the Node-only toolset module.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_MEMORY_SYNC_INTERVAL_MS = exports.DEFAULT_MEMORY_SYNC_INTERVAL_MS = void 0;
exports.checkMemorySyncInterval = checkMemorySyncInterval;
const error_1 = require("../../core/error.js");
/**
 * How often (milliseconds) the worker syncs the session's memory stores back
 * while the session runs. Checked after each dispatched tool call.
 */
exports.DEFAULT_MEMORY_SYNC_INTERVAL_MS = 15000;
/**
 * The shortest sync interval accepted. Each sync lists every attached store,
 * so anything tighter mostly spends requests rediscovering that nothing
 * changed.
 */
exports.MIN_MEMORY_SYNC_INTERVAL_MS = 5000;
/** Throw unless `ms` is a usable sync interval. `option` names it in the message. */
function checkMemorySyncInterval(ms, option) {
    if (!(ms >= exports.MIN_MEMORY_SYNC_INTERVAL_MS)) {
        throw new error_1.AnthropicError(`${option} must be at least ${exports.MIN_MEMORY_SYNC_INTERVAL_MS}ms (got ${ms}); ` +
            'to run without memory sync, pass `memorySyncIntervalMs: null` to the worker instead');
    }
}
//# sourceMappingURL=sync-interval.js.map