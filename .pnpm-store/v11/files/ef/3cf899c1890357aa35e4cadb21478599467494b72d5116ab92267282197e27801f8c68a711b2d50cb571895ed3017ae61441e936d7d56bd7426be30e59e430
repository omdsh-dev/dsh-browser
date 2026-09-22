/**
 * The memory sync cadence, split out of `memories.ts` so runtime-agnostic
 * callers (the environment worker) can validate an interval up front without
 * reaching into the Node-only toolset module.
 */
/**
 * How often (milliseconds) the worker syncs the session's memory stores back
 * while the session runs. Checked after each dispatched tool call.
 */
export declare const DEFAULT_MEMORY_SYNC_INTERVAL_MS = 15000;
/**
 * The shortest sync interval accepted. Each sync lists every attached store,
 * so anything tighter mostly spends requests rediscovering that nothing
 * changed.
 */
export declare const MIN_MEMORY_SYNC_INTERVAL_MS = 5000;
/** Throw unless `ms` is a usable sync interval. `option` names it in the message. */
export declare function checkMemorySyncInterval(ms: number, option: string): void;
//# sourceMappingURL=sync-interval.d.ts.map