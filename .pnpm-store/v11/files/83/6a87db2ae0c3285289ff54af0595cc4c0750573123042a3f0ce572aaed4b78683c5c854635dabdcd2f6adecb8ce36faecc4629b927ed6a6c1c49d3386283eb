/**
 * Session-level memory-store download and sync.
 *
 * A session may have several memory stores attached. This module resolves
 * where each store's folder goes on disk, opens a {@link LocalFileStore}
 * there, and reconciles each folder with its remote store — the merge rules
 * live on {@link SessionMemoryStores}.
 *
 * Node-only (it sits on the filesystem-backed FileStore); like `skills.ts`,
 * it is reachable through the shimmed `node.ts` entry point.
 */
import type { Anthropic } from "../../client.js";
import { AnthropicError } from "../../core/error.js";
import type { BetaManagedAgentsSession } from "../../resources/beta/sessions/sessions.js";
export { DEFAULT_MEMORY_SYNC_INTERVAL_MS, MIN_MEMORY_SYNC_INTERVAL_MS } from "./sync-interval.js";
/**
 * Whether a locally deleted file may delete its memory on the server:
 * `"enabled"` sends the delete, `"log_only"` runs the checks but only logs,
 * `"disabled"` never deletes.
 */
export type MemoryDeleteMode = 'enabled' | 'log_only' | 'disabled';
/**
 * Time bound the worker puts on each teardown pass — the final
 * {@link SessionMemoryStores.finish}, then {@link SessionMemoryStores.flushWrites} —
 * so a slow server cannot stall teardown.
 */
export declare const MEMORY_FLUSH_TIMEOUT_MS = 30000;
/**
 * Marker file stamped into every store folder; a sync trusts the folder only
 * when it matches. Never itself syncs.
 */
export declare const MARKER_PATH = ".anthropic-memory-store";
/** How long a file must stay missing locally before its server delete goes out. */
export declare const DELETE_CORROBORATION_MS = 30000;
/**
 * How many uploads one store's flush keeps in flight. At ~0.3s per upload,
 * 32 clears the server's 2000-memories-per-store cap inside
 * {@link MEMORY_FLUSH_TIMEOUT_MS}.
 */
export declare const UPLOAD_CONCURRENCY = 32;
/**
 * A session's memory stores could not be mounted.
 *
 * Thrown by {@link SessionMemoryStores.download} when a store cannot be
 * materialised on disk, and by the environment worker when a work item for a
 * session that has memory stores carried no sessions token to reach them with.
 */
export declare class SessionMemoryError extends AnthropicError {
    constructor(message: string, cause?: unknown);
}
export interface SessionMemoryStoresOptions {
    /** Base directory for the `{workdir}/memory/<name>` fallback store location. */
    workdir: string;
    /**
     * How often (milliseconds) {@link SessionMemoryStores.syncIfDue} actually
     * syncs. Defaults to {@link DEFAULT_MEMORY_SYNC_INTERVAL_MS} (15s); values
     * below {@link MIN_MEMORY_SYNC_INTERVAL_MS} (5s) are rejected.
     */
    syncIntervalMs?: number;
    /** See {@link MemoryDeleteMode}. Defaults to `"enabled"`. */
    syncDeletions?: MemoryDeleteMode;
}
/**
 * The memory stores attached to one session, materialised on disk.
 *
 * {@link SessionMemoryStores.download} opens a {@link LocalFileStore} at each
 * attached store's directory (its `mount_path`, or a workdir fallback — see
 * {@link SessionMemoryStores.download}), pulls its memories, and records each
 * one's `content_sha256` as the sync baseline. Each sync
 * ({@link SessionMemoryStores.syncIfDue} on the worker's cadence,
 * {@link SessionMemoryStores.finish} once at the end) reconciles disk against
 * server, per store and per path:
 *
 * - a memory changed only remotely is written to disk;
 * - a file changed only locally is uploaded — an update with a
 *   `content_sha256` precondition, or a create for a new file;
 * - a file changed on both sides logs a warning and takes the server version;
 * - a file the server refuses (too large, invalid content) is skipped —
 *   warned once and retried only after the file changes; other files keep
 *   syncing;
 * - a file deleted locally is deleted on the server after a delay and a
 *   re-check — never on the first sync that notices, and only up to a
 *   per-sync cap. `syncDeletions` gates it;
 * - a memory deleted on the server is deleted on disk — unless the local
 *   file holds un-pushed edits: a writable store re-creates the memory
 *   from the file, a read-only one keeps the file unsynced;
 * - a store attached read-only pulls but never pushes.
 *
 * A download pulls the whole store, so it lists with content included. The
 * recurring syncs instead run two phases: a content-free listing (paths and
 * shas) drives the merge decisions, then only the memories actually being
 * written to disk are fetched, a bounded number at a time. A sync that finds
 * nothing changed moves no content at all.
 *
 * A file whose write to disk failed is never in the baseline, so its absence
 * reads as a failed download — it is pulled again, never deleted. A write
 * never re-creates a store folder that vanished mid-sync: it fails, and the
 * next sync's scan finds whatever is at the path by then — nothing
 * (re-downloaded) or someone else's files (left alone) — under the rules
 * below.
 *
 * A store folder that loses its {@link MARKER_PATH} marker, is emptied,
 * or vanishes is re-downloaded rather than treated as a mass local
 * delete; a folder whose marker names another store is left as found —
 * nothing pushed, nothing deleted.
 *
 * Two things about the store's directory make
 * {@link SessionMemoryStores.download} refuse the session outright, with
 * {@link SessionMemoryError}: a `mount_path` that is not a clean absolute
 * path, and a directory already sitting at that path.
 *
 * {@link SessionMemoryStores.download} throws on the first store it cannot
 * materialise. The syncs never throw: mid-session, one bad store or one bad
 * file is logged and the rest continue. Instances are not safe for concurrent
 * use. The worker builds one on its token-scoped sub-client (the memory
 * endpoints reject the environment key): `syncIfDue` after each tool call,
 * `finish` once at a clean end, a bounded {@link SessionMemoryStores.flushWrites}
 * in every teardown, `dispose` last.
 */
export declare class SessionMemoryStores {
    #private;
    constructor(client: Anthropic, opts: SessionMemoryStoresOptions);
    /**
     * Every attached store's root directory.
     *
     * The worker lists these as the file tools' allowed roots so a store
     * mounted outside the workdir stays reachable.
     */
    get roots(): string[];
    /**
     * Root directories of stores attached read-only.
     *
     * The file tools consult this to refuse writes into read-only stores.
     */
    get readOnlyRoots(): string[];
    /**
     * Download every attached store's memories to disk.
     *
     * `session` arrives already fetched — one snapshot shared with the skills
     * download, so the two cannot disagree about the resources.
     */
    download(session: BetaManagedAgentsSession): Promise<void>;
    /**
     * The session's last sync — skips the delete wait, so calling it twice
     * would undo the protection; it throws instead.
     */
    finish(): Promise<void>;
    /** @internal — reconcile every store once; the tests' deterministic driver */
    syncAll(final: boolean): Promise<void>;
    /** Sync when `syncIntervalMs` has elapsed since the last one. Never throws. */
    syncIfDue(): Promise<void>;
    /**
     * Upload new and changed files; send no deletes and pull nothing.
     *
     * The push-only rescue pass for a session ending on an error or
     * cancel — best-effort, bounded by the caller: once `signal` aborts no
     * further upload starts, each store cut off part-way logs how many
     * changed files it had not finished uploading, and this resolves without
     * waiting for requests already in flight. Each store uploads up to
     * {@link UPLOAD_CONCURRENCY} files at a time. Skips read-only stores,
     * refused files, files the server already holds, and folders that fail
     * the marker check. Never throws.
     */
    flushWrites(signal?: AbortSignal): Promise<void>;
    /**
     * Remove every store directory that {@link SessionMemoryStores.download}
     * created. Pre-existing directories are left alone — that is
     * {@link FileStore.dispose}'s own rule. A folder that fails the marker
     * check is kept too — sync left it as found, so must dispose.
     */
    dispose(): Promise<void>;
}
//# sourceMappingURL=memories.d.ts.map