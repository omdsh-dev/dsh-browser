"use strict";
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
var _SessionMemoryStores_instances, _SessionMemoryStores_client, _SessionMemoryStores_workdir, _SessionMemoryStores_syncIntervalMs, _SessionMemoryStores_syncDeletions, _SessionMemoryStores_log, _SessionMemoryStores_lastSyncAt, _SessionMemoryStores_finished, _SessionMemoryStores_stores, _SessionMemoryStores_storeRoot, _SessionMemoryStores_scanMarker, _SessionMemoryStores_syncStore, _SessionMemoryStores_flushStore, _SessionMemoryStores_recover, _SessionMemoryStores_stampAndPull, _SessionMemoryStores_syncPath, _SessionMemoryStores_removeLocal, _SessionMemoryStores_write, _SessionMemoryStores_pullAll, _SessionMemoryStores_uploadAll, _SessionMemoryStores_listMemories, _SessionMemoryStores_upload, _SessionMemoryStores_corroboratedDelete, _SessionMemoryStores_deleteRemote;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionMemoryStores = exports.SessionMemoryError = exports.UPLOAD_CONCURRENCY = exports.DELETE_CORROBORATION_MS = exports.MARKER_PATH = exports.MEMORY_FLUSH_TIMEOUT_MS = exports.MIN_MEMORY_SYNC_INTERVAL_MS = exports.DEFAULT_MEMORY_SYNC_INTERVAL_MS = void 0;
const tslib_1 = require("../../internal/tslib.js");
const node_1 = require("../../internal/node.js");
const error_1 = require("../../core/error.js");
const log_1 = require("../../internal/utils/log.js");
const bytes_1 = require("../../internal/utils/bytes.js");
const backoff_1 = require("../../internal/utils/backoff.js");
const file_store_1 = require("../../internal/file-store.js");
const sync_interval_1 = require("./sync-interval.js");
var sync_interval_2 = require("./sync-interval.js");
Object.defineProperty(exports, "DEFAULT_MEMORY_SYNC_INTERVAL_MS", { enumerable: true, get: function () { return sync_interval_2.DEFAULT_MEMORY_SYNC_INTERVAL_MS; } });
Object.defineProperty(exports, "MIN_MEMORY_SYNC_INTERVAL_MS", { enumerable: true, get: function () { return sync_interval_2.MIN_MEMORY_SYNC_INTERVAL_MS; } });
/**
 * Time bound the worker puts on each teardown pass — the final
 * {@link SessionMemoryStores.finish}, then {@link SessionMemoryStores.flushWrites} —
 * so a slow server cannot stall teardown.
 */
exports.MEMORY_FLUSH_TIMEOUT_MS = 30000;
/**
 * Marker file stamped into every store folder; a sync trusts the folder only
 * when it matches. Never itself syncs.
 */
exports.MARKER_PATH = '.anthropic-memory-store';
const MARKER_VERSION = 1;
function markerSha(memoryStoreId) {
    return node_1.crypto
        .createHash('sha256')
        .update(`version ${MARKER_VERSION}\n${memoryStoreId}`, 'utf-8')
        .digest('hex');
}
/** How long a file must stay missing locally before its server delete goes out. */
exports.DELETE_CORROBORATION_MS = 30000;
/**
 * Page sizes for memory listings — the API's maximum per view: `basic` pages
 * carry up to 100 items, `full` pages are capped by the server.
 */
const LIST_PAGE_SIZE = 100;
const FULL_LIST_PAGE_SIZE = 20;
/**
 * How many single-memory content fetches may be in flight at once during one
 * store's pull pass. A sync rarely pulls more than a handful of memories, so
 * a higher cap buys nothing in the common case.
 */
const FETCH_CONCURRENCY = 16;
/**
 * How many uploads one store's flush keeps in flight. At ~0.3s per upload,
 * 32 clears the server's 2000-memories-per-store cap inside
 * {@link MEMORY_FLUSH_TIMEOUT_MS}.
 */
exports.UPLOAD_CONCURRENCY = 32;
/**
 * Per-sync remote-delete cap bounds. The floor lets a small store's
 * deletes clear in one pass; the ceiling caps damage on large ones.
 */
const DELETE_CAP_FLOOR = 8;
const DELETE_CAP_CEILING = 50;
/**
 * A session's memory stores could not be mounted.
 *
 * Thrown by {@link SessionMemoryStores.download} when a store cannot be
 * materialised on disk, and by the environment worker when a work item for a
 * session that has memory stores carried no sessions token to reach them with.
 */
class SessionMemoryError extends error_1.AnthropicError {
    constructor(message, cause) {
        super(message);
        this.name = 'SessionMemoryError';
        // in some environments the 'cause' property is already declared
        // @ts-ignore
        if (cause !== undefined)
            this.cause = cause;
    }
}
exports.SessionMemoryError = SessionMemoryError;
/** One sync's remote-delete gate and counters. */
class DeletePass {
    constructor(mode, cap, 
    /** Skip the delete wait — set on the session's last sync. */
    waiveWindow) {
        this.mode = mode;
        this.cap = cap;
        this.waiveWindow = waiveWindow;
        this.attempted = 0;
        this.capped = 0;
        this.suppressed = 0;
    }
    takeSlot() {
        if (this.attempted >= this.cap) {
            this.capped++;
            return false;
        }
        this.attempted++;
        return true;
    }
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
class SessionMemoryStores {
    constructor(client, opts) {
        _SessionMemoryStores_instances.add(this);
        _SessionMemoryStores_client.set(this, void 0);
        _SessionMemoryStores_workdir.set(this, void 0);
        _SessionMemoryStores_syncIntervalMs.set(this, void 0);
        _SessionMemoryStores_syncDeletions.set(this, void 0);
        _SessionMemoryStores_log.set(this, void 0);
        _SessionMemoryStores_lastSyncAt.set(this, void 0);
        _SessionMemoryStores_finished.set(this, false);
        _SessionMemoryStores_stores.set(this, []);
        tslib_1.__classPrivateFieldSet(this, _SessionMemoryStores_client, client, "f");
        tslib_1.__classPrivateFieldSet(this, _SessionMemoryStores_workdir, opts.workdir, "f");
        tslib_1.__classPrivateFieldSet(this, _SessionMemoryStores_syncIntervalMs, opts.syncIntervalMs ?? sync_interval_1.DEFAULT_MEMORY_SYNC_INTERVAL_MS, "f");
        (0, sync_interval_1.checkMemorySyncInterval)(tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_syncIntervalMs, "f"), 'syncIntervalMs');
        tslib_1.__classPrivateFieldSet(this, _SessionMemoryStores_syncDeletions, opts.syncDeletions ?? 'enabled', "f");
        tslib_1.__classPrivateFieldSet(this, _SessionMemoryStores_log, (0, log_1.loggerFor)(client), "f");
        tslib_1.__classPrivateFieldSet(this, _SessionMemoryStores_lastSyncAt, Date.now(), "f");
    }
    /**
     * Every attached store's root directory.
     *
     * The worker lists these as the file tools' allowed roots so a store
     * mounted outside the workdir stays reachable.
     */
    get roots() {
        return tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_stores, "f").map((s) => s.files.root().path);
    }
    /**
     * Root directories of stores attached read-only.
     *
     * The file tools consult this to refuse writes into read-only stores.
     */
    get readOnlyRoots() {
        return tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_stores, "f").filter((s) => s.readOnly).map((s) => s.files.root().path);
    }
    /**
     * Download every attached store's memories to disk.
     *
     * `session` arrives already fetched — one snapshot shared with the skills
     * download, so the two cannot disagree about the resources.
     */
    async download(session) {
        for (const resource of session.resources) {
            if (resource.type !== 'memory_store')
                continue;
            const root = tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_storeRoot).call(this, resource);
            let store;
            try {
                store = {
                    memoryStoreId: resource.memory_store_id,
                    // utf8: a binary file is refused at put/get, not mid-sync.
                    files: await file_store_1.LocalFileStore.open(root, { utf8: true }),
                    readOnly: resource.access === 'read_only',
                    baseline: new Map(),
                    refusedShas: new Map(),
                    pendingDeletes: new Map(),
                };
                // A root `open` did not create is a dead run's leftovers; the first
                // sync would upload them into the customer's store.
                if (!store.files.root().removedOnDispose) {
                    // The configured path, not root().path — that one is resolved and
                    // would name a symlinked mount's target.
                    throw new SessionMemoryError(`something already exists at the memory store's path: ${root} ` +
                        `(memory_store_id=${resource.memory_store_id}); ` +
                        'it must not exist when the session starts');
                }
                try {
                    await store.files.createRoot();
                }
                catch (e) {
                    if (!isErrno(e))
                        throw e;
                    // An unmountable root fails the item, not just one file.
                    throw new SessionMemoryError(`cannot create the memory store's folder: ${root} ` +
                        `(memory_store_id=${resource.memory_store_id}): ${e}; ` +
                        'the worker host must make this mount path writable', e);
                }
                await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_stampAndPull).call(this, store);
                tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").info('downloaded memories', {
                    count: store.baseline.size,
                    memory_store_id: store.memoryStoreId,
                    dest: store.files.root().path,
                });
                tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_stores, "f").push(store);
            }
            catch (e) {
                // A half-downloaded folder self-destructs; `dispose` leaves a refused
                // pre-existing directory exactly as found.
                if (store)
                    await store.files.dispose().catch(() => { });
                // Every store must land: a session missing a folder its system prompt
                // names runs with amnesia and syncs nothing back.
                if (e instanceof SessionMemoryError)
                    throw e;
                throw new SessionMemoryError(`failed to download memory store memory_store_id=${resource.memory_store_id}: ${e}`, e);
            }
        }
        tslib_1.__classPrivateFieldSet(this, _SessionMemoryStores_lastSyncAt, Date.now(), "f");
    }
    /**
     * The session's last sync — skips the delete wait, so calling it twice
     * would undo the protection; it throws instead.
     */
    async finish() {
        if (tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_finished, "f")) {
            throw new error_1.AnthropicError("finish() was already called: it is the session's last sync and runs once");
        }
        tslib_1.__classPrivateFieldSet(this, _SessionMemoryStores_finished, true, "f");
        await this.syncAll(true);
    }
    /** @internal — reconcile every store once; the tests' deterministic driver */
    async syncAll(final) {
        await Promise.all(tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_stores, "f").map((store) => tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_syncStore).call(this, store, final)));
        tslib_1.__classPrivateFieldSet(this, _SessionMemoryStores_lastSyncAt, Date.now(), "f");
    }
    /** Sync when `syncIntervalMs` has elapsed since the last one. Never throws. */
    async syncIfDue() {
        if (Date.now() - tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_lastSyncAt, "f") < tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_syncIntervalMs, "f"))
            return;
        await this.syncAll(false);
    }
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
    async flushWrites(signal) {
        await Promise.all(tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_stores, "f").map((store) => tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_flushStore).call(this, store, signal)));
    }
    /**
     * Remove every store directory that {@link SessionMemoryStores.download}
     * created. Pre-existing directories are left alone — that is
     * {@link FileStore.dispose}'s own rule. A folder that fails the marker
     * check is kept too — sync left it as found, so must dispose.
     */
    async dispose() {
        for (const store of tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_stores, "f")) {
            const root = store.files.root();
            try {
                const scan = await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_scanMarker).call(this, store);
                if (!scan.markerOk && Object.keys(scan.files).length > 0) {
                    tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`${scan.distrustReason}; leaving the memory store folder on disk`, {
                        root: root.path,
                        memory_store_id: store.memoryStoreId,
                    });
                    continue;
                }
                await store.files.dispose();
            }
            catch (e) {
                if (!(e instanceof file_store_1.FileStoreError) && !isErrno(e))
                    throw e;
                tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('failed to remove the memory store folder', {
                    root: store.files.root().path,
                    memory_store_id: store.memoryStoreId,
                    error: String(e),
                });
                continue;
            }
            if (root.removedOnDispose) {
                tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").info('removed memory store dir', {
                    dest: root.path,
                    memory_store_id: store.memoryStoreId,
                });
            }
        }
    }
}
exports.SessionMemoryStores = SessionMemoryStores;
_SessionMemoryStores_client = new WeakMap(), _SessionMemoryStores_workdir = new WeakMap(), _SessionMemoryStores_syncIntervalMs = new WeakMap(), _SessionMemoryStores_syncDeletions = new WeakMap(), _SessionMemoryStores_log = new WeakMap(), _SessionMemoryStores_lastSyncAt = new WeakMap(), _SessionMemoryStores_finished = new WeakMap(), _SessionMemoryStores_stores = new WeakMap(), _SessionMemoryStores_instances = new WeakSet(), _SessionMemoryStores_storeRoot = function _SessionMemoryStores_storeRoot(resource) {
    if (resource.mount_path) {
        if (!(0, file_store_1.isPathLegal)(resource.mount_path)) {
            throw new SessionMemoryError(`memory store mount_path is not a clean absolute path: ${JSON.stringify(resource.mount_path)} ` +
                `(memory_store_id=${resource.memory_store_id})`);
        }
        return resource.mount_path;
    }
    // No mount_path at all: nothing points the agent anywhere, so the workdir
    // is as good a home as any.
    return node_1.path.join(tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_workdir, "f"), 'memory', resource.name || resource.memory_store_id);
}, _SessionMemoryStores_scanMarker = async function _SessionMemoryStores_scanMarker(store) {
    const local = await store.files.hashtree();
    const marker = local[exports.MARKER_PATH];
    delete local[exports.MARKER_PATH];
    if (marker === markerSha(store.memoryStoreId)) {
        return { files: local, markerOk: true, distrustReason: null };
    }
    return {
        files: local,
        markerOk: false,
        distrustReason: marker !== undefined ? 'the marker file does not match this store' : 'the marker file is gone',
    };
}, _SessionMemoryStores_syncStore = async function _SessionMemoryStores_syncStore(store, final) {
    try {
        const scan = await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_scanMarker).call(this, store);
        const local = scan.files;
        if (!scan.markerOk) {
            if (Object.keys(local).length > 0) {
                tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`${scan.distrustReason}; leaving the memory store folder as found and not syncing`, {
                    root: store.files.root().path,
                    memory_store_id: store.memoryStoreId,
                });
                return;
            }
            await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_recover).call(this, store, 'the folder or its marker is gone');
            return;
        }
        // A lone file vanishing is an ordinary deletion; two or more at
        // once with nothing left is a wiped folder.
        if (Object.keys(local).length === 0 && store.baseline.size > 1) {
            await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_recover).call(this, store, 'every memory file is gone at once');
            return;
        }
        const remote = new Map();
        for await (const [rel, item] of tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_listMemories).call(this, store.memoryStoreId)) {
            remote.set(rel, item);
        }
        const deletes = new DeletePass(tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_syncDeletions, "f"), Math.max(DELETE_CAP_FLOOR, Math.min(DELETE_CAP_CEILING, Math.floor(store.baseline.size / 4))), final);
        const pulls = [];
        const baseline = new Map();
        const paths = [...new Set([...remote.keys(), ...Object.keys(local), ...store.baseline.keys()])].sort();
        for (const rel of paths) {
            const remoteItem = remote.get(rel);
            const localSha = local[rel];
            const baseSha = store.baseline.get(rel);
            let sha;
            if (localSha === undefined &&
                baseSha !== undefined &&
                remoteItem !== undefined &&
                remoteItem.content_sha256 === baseSha &&
                !store.readOnly) {
                sha = await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_corroboratedDelete).call(this, store, rel, remoteItem, baseSha, deletes);
            }
            else {
                sha = await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_syncPath).call(this, store, rel, remoteItem, localSha, pulls);
            }
            if (sha !== undefined)
                baseline.set(rel, sha);
        }
        store.baseline = baseline;
        // The content pass: everything above moved only shas.
        await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_pullAll).call(this, store, pulls);
        if (deletes.suppressed > 0) {
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").debug('remote deletes are disabled; locally deleted memories stay on the server', {
                count: deletes.suppressed,
                memory_store_id: store.memoryStoreId,
            });
        }
        if (deletes.capped > 0) {
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`delete cap reached: ${deletes.mode === 'log_only' ? 'would send' : 'sent'} ` +
                `${deletes.attempted} deletes, held ${deletes.capped} for later syncs`, { memory_store_id: store.memoryStoreId });
        }
    }
    catch (e) {
        tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('memory sync failed', { memory_store_id: store.memoryStoreId, error: String(e) });
    }
}, _SessionMemoryStores_flushStore = async function _SessionMemoryStores_flushStore(store, signal) {
    const dirty = new Map();
    const unsent = new Set();
    const push = async () => {
        if (store.readOnly)
            return;
        const scan = await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_scanMarker).call(this, store);
        if (!scan.markerOk) {
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`${scan.distrustReason}; not uploading anything from the memory store folder`, {
                root: store.files.root().path,
                memory_store_id: store.memoryStoreId,
            });
            return;
        }
        for (const [rel, sha] of Object.entries(scan.files)) {
            if (sha !== store.baseline.get(rel) && store.refusedShas.get(rel) !== sha) {
                dirty.set(rel, sha);
                unsent.add(rel);
            }
        }
        if (dirty.size === 0 || signal?.aborted)
            return;
        const remote = new Map();
        for await (const [rel, item] of tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_listMemories).call(this, store.memoryStoreId)) {
            if (signal?.aborted)
                return;
            remote.set(rel, item);
        }
        const uploads = [];
        for (const rel of [...dirty.keys()].sort()) {
            const localSha = dirty.get(rel);
            const baseSha = store.baseline.get(rel);
            const existing = remote.get(rel);
            if (existing !== undefined && existing.content_sha256 === localSha) {
                store.baseline.set(rel, existing.content_sha256);
                unsent.delete(rel);
                continue;
            }
            if (existing !== undefined && existing.content_sha256 !== baseSha) {
                tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('memory changed both locally and remotely; the flush leaves the remote version', {
                    path: rel,
                    memory_store_id: store.memoryStoreId,
                });
                unsent.delete(rel);
                continue;
            }
            uploads.push([rel, localSha, existing]);
        }
        await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_uploadAll).call(this, store, uploads, unsent, signal);
    };
    try {
        await settledOrAborted(push(), signal);
        if (signal?.aborted && unsent.size > 0) {
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`memory flush cut off part-way; ${unsent.size} of ${dirty.size} changed files had not finished uploading`, { memory_store_id: store.memoryStoreId });
        }
    }
    catch (e) {
        tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('memory flush failed', { memory_store_id: store.memoryStoreId, error: String(e) });
    }
}, _SessionMemoryStores_recover = 
/** Rebuild a destroyed folder from the server; sends no deletes, no uploads. */
async function _SessionMemoryStores_recover(store, reason) {
    tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`${reason}; re-downloading the memory store folder instead of syncing`, {
        root: store.files.root().path,
        memory_store_id: store.memoryStoreId,
    });
    await store.files.createRoot();
    await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_stampAndPull).call(this, store);
}, _SessionMemoryStores_stampAndPull = 
/**
 * Write the marker, then pull every remote memory. Baseline is cleared
 * first so a failed write never leaves an entry whose file is not on disk.
 * Every memory is needed here, so the listing carries the content — pages
 * cost far fewer round-trips than a request per memory.
 */
async function _SessionMemoryStores_stampAndPull(store) {
    store.baseline = new Map();
    store.pendingDeletes.clear();
    await store.files.put(exports.MARKER_PATH, `version ${MARKER_VERSION}\n${store.memoryStoreId}`);
    for await (const [rel, item] of tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_listMemories).call(this, store.memoryStoreId, 'full')) {
        if (await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_write).call(this, store, rel, item.content ?? '')) {
            store.baseline.set(rel, item.content_sha256);
        }
    }
}, _SessionMemoryStores_syncPath = 
/**
 * Reconcile one path. Returns the sha to record in the baseline, or
 * `undefined` to drop the path from it.
 *
 * `pulls` is an output: when the remote version should be written to disk,
 * this appends `[rel, remote]` to it instead of writing — `rel` is the
 * file to write, `remote` the listed memory whose content `#pullAll` will
 * fetch and write there.
 */
async function _SessionMemoryStores_syncPath(store, rel, remote, localSha, pulls) {
    const baseSha = store.baseline.get(rel);
    if (localSha !== undefined) {
        store.pendingDeletes.delete(rel);
    }
    if (!remote) {
        if (localSha === undefined) {
            store.pendingDeletes.delete(rel);
            return undefined;
        }
        if (baseSha !== undefined) {
            if (localSha === baseSha) {
                const fresh = await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_removeLocal).call(this, store, rel, baseSha);
                if (fresh === undefined)
                    return undefined;
                if (fresh === baseSha)
                    return baseSha;
                localSha = fresh;
            }
            // The file holds an un-pushed edit — the only copy; falling
            // through re-creates or keeps it.
            if (store.readOnly) {
                tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('memory deleted remotely but edited locally; keeping the file, ' +
                    'which a read-only store cannot push', { path: rel, memory_store_id: store.memoryStoreId });
            }
            else if (store.refusedShas.get(rel) !== localSha) {
                tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").info('memory deleted remotely but edited locally; re-creating it from the file', {
                    path: rel,
                    memory_store_id: store.memoryStoreId,
                });
            }
        }
        if (store.readOnly)
            return undefined;
        if (store.refusedShas.get(rel) === localSha)
            return undefined;
        return await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_upload).call(this, store, rel, localSha, undefined);
    }
    const remoteSha = remote.content_sha256;
    const remoteChanged = remoteSha !== baseSha;
    const locallyEdited = localSha !== undefined && localSha !== baseSha && localSha !== remoteSha;
    // Read-only stores never push, so their local edits don't count.
    const localChanged = !store.readOnly && locallyEdited;
    if (localSha === undefined && baseSha !== undefined) {
        // Only successful writes enter the baseline, so this file was verifiably
        // on disk and is now gone: a real local deletion. The unchanged-remote
        // case went to #corroboratedDelete.
        if (remoteChanged) {
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('memory deleted locally but changed remotely; restoring the remote version', {
                path: rel,
                memory_store_id: store.memoryStoreId,
            });
            store.pendingDeletes.delete(rel);
            pulls.push([rel, remote]);
        }
        return baseSha;
    }
    if (remoteChanged) {
        // The file already holds the remote bytes — adopt without a fetch.
        if (localSha === remoteSha)
            return remoteSha;
        // locallyEdited, not localChanged: warn on read-only overwrites too.
        if (locallyEdited) {
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('memory changed both locally and remotely; keeping the remote version', {
                path: rel,
                memory_store_id: store.memoryStoreId,
            });
        }
        pulls.push([rel, remote]);
        return baseSha;
    }
    if (localChanged) {
        if (store.refusedShas.get(rel) === localSha)
            return remoteSha;
        return (await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_upload).call(this, store, rel, localSha, remote)) ?? remoteSha;
    }
    return remoteSha;
}, _SessionMemoryStores_removeLocal = 
/**
 * Remove the file for a memory the server no longer has, if it still holds
 * `expectSha`. Returns `undefined` when the file is gone from disk,
 * `expectSha` when it must stay in the baseline (I/O error), or the file's
 * fresh sha when it was edited since the scan.
 */
async function _SessionMemoryStores_removeLocal(store, rel, expectSha) {
    // Re-read: an edit since the scan makes this file the only copy.
    let freshSha;
    try {
        freshSha = await store.files.hashFile(rel);
    }
    catch (e) {
        if (!(e instanceof file_store_1.FileStoreError) && !isErrno(e))
            throw e;
        return expectSha;
    }
    if (freshSha === null)
        return undefined;
    if (freshSha !== expectSha)
        return freshSha;
    try {
        await store.files.remove(rel);
    }
    catch (e) {
        if (!(e instanceof file_store_1.FileStoreError) && !isErrno(e))
            throw e;
        tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('failed to remove memory deleted remotely', {
            path: rel,
            memory_store_id: store.memoryStoreId,
            error: String(e),
        });
        return expectSha;
    }
    return undefined;
}, _SessionMemoryStores_write = 
/**
 * Write a memory's content to disk; `false` (and a warning) on failure.
 *
 * A `..` component in the wire path reaches here as {@link FileStoreError} —
 * that is the escape guard.
 */
async function _SessionMemoryStores_write(store, rel, content) {
    try {
        await store.files.put(rel, content);
    }
    catch (e) {
        if (!(e instanceof file_store_1.FileStoreError) && !isErrno(e))
            throw e;
        tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('failed to write memory', {
            path: rel,
            memory_store_id: store.memoryStoreId,
            error: String(e),
        });
        return false;
    }
    return true;
}, _SessionMemoryStores_pullAll = 
/**
 * Fetch and write the given memories, {@link FETCH_CONCURRENCY} at a time.
 *
 * The sync's content pass: the listing carried no content, so each memory
 * is fetched individually and written as it arrives. On success the path's
 * baseline advances; on a failed fetch or write the old entry stays and the
 * next sync retries. A 404 means the memory was deleted after the listing —
 * the next sync reconciles it.
 */
async function _SessionMemoryStores_pullAll(store, pulls) {
    if (pulls.length === 0)
        return;
    const pullOne = async (rel, listed) => {
        let item;
        try {
            item = await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_client, "f").beta.memoryStores.memories.retrieve(listed.id, {
                memory_store_id: store.memoryStoreId,
                view: 'full',
            });
        }
        catch (e) {
            if ((0, backoff_1.isStatus)(e, 404))
                return;
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('failed to fetch memory content', {
                path: rel,
                memory_store_id: store.memoryStoreId,
                error: String(e),
            });
            return;
        }
        if (await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_write).call(this, store, rel, item.content ?? '')) {
            store.baseline.set(rel, item.content_sha256);
        }
    };
    // A fixed pool of workers drains the queue; the write stays inside the
    // worker so a slow disk cannot let fetched bodies pile up beyond the bound.
    const queue = pulls[Symbol.iterator]();
    const worker = async () => {
        for (const [rel, listed] of queue)
            await pullOne(rel, listed);
    };
    await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, pulls.length) }, worker));
}, _SessionMemoryStores_uploadAll = 
/**
 * Upload the given files, {@link UPLOAD_CONCURRENCY} at a time, taking each
 * path off `unsent` as its upload returns. No upload starts once `signal`
 * aborts; the ones already in flight run to completion.
 */
async function _SessionMemoryStores_uploadAll(store, uploads, unsent, signal) {
    const queue = uploads[Symbol.iterator]();
    const worker = async () => {
        for (const [rel, localSha, existing] of queue) {
            if (signal?.aborted)
                return;
            const sha = await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_upload).call(this, store, rel, localSha, existing);
            unsent.delete(rel);
            if (sha !== undefined)
                store.baseline.set(rel, sha);
        }
    };
    await Promise.all(Array.from({ length: Math.min(exports.UPLOAD_CONCURRENCY, uploads.length) }, worker));
}, _SessionMemoryStores_listMemories = 
/**
 * The store's memories keyed by relative path (the wire path's leading `/`
 * stripped — `#upload` re-prefixes it) — `basic` view (shas, no content) at
 * {@link LIST_PAGE_SIZE} per page unless the caller needs `full` pages.
 * `memory_prefix` rollups and the reserved marker path are skipped.
 */
async function* _SessionMemoryStores_listMemories(memoryStoreId, view = 'basic') {
    const limit = view === 'basic' ? LIST_PAGE_SIZE : FULL_LIST_PAGE_SIZE;
    for await (const item of tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_client, "f").beta.memoryStores.memories.list(memoryStoreId, { view, limit })) {
        if (item.type !== 'memory')
            continue;
        const rel = item.path.replace(/^\/+/, '');
        if (rel === exports.MARKER_PATH) {
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('the server listed the reserved marker path; skipping', {
                path: item.path,
                memory_store_id: memoryStoreId,
            });
            continue;
        }
        yield [rel, item];
    }
}, _SessionMemoryStores_upload = 
/**
 * Push one local file; `undefined` keeps the old baseline so the next pass retries.
 *
 * A refusal the server would repeat (400/413, the utf-8 gate) enters
 * `refusedShas`: warned once, retried only after the file changes.
 */
async function _SessionMemoryStores_upload(store, rel, localSha, existing) {
    try {
        const data = await store.files.get(rel);
        if (data === null)
            return undefined;
        const content = (0, bytes_1.decodeUTF8)(data);
        const item = existing ?
            await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_client, "f").beta.memoryStores.memories.update(existing.id, {
                memory_store_id: store.memoryStoreId,
                content,
                precondition: { type: 'content_sha256', content_sha256: existing.content_sha256 },
            })
            : await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_client, "f").beta.memoryStores.memories.create(store.memoryStoreId, {
                path: '/' + rel,
                content,
            });
        store.refusedShas.delete(rel);
        return item.content_sha256;
    }
    catch (e) {
        if (existing && (0, backoff_1.isStatus)(e, 404)) {
            // Deleted remotely since the listing, so this file is now the only copy.
            return await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_upload).call(this, store, rel, localSha, undefined);
        }
        const permanent = e instanceof file_store_1.FileStoreError || (0, backoff_1.isStatus)(e, 400) || (0, backoff_1.isStatus)(e, 413);
        if (existing && (0, backoff_1.isStatus)(e, 409)) {
            // The precondition lost a race: the remote moved under us, so the push
            // is dropped. The local file is now stale — the next sync sees
            // remoteChanged and pulls the winner over it.
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('memory changed both locally and remotely; the upload was refused and the local edit loses', {
                path: rel,
                memory_store_id: store.memoryStoreId,
            });
        }
        else if (permanent && localSha !== undefined) {
            store.refusedShas.set(rel, localSha);
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('the server rejected this memory file, so it stays un-synced until its content changes', { path: rel, memory_store_id: store.memoryStoreId, rejection: String(e) });
        }
        else {
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('failed to upload memory', {
                path: rel,
                memory_store_id: store.memoryStoreId,
                error: String(e),
            });
        }
        return undefined;
    }
}, _SessionMemoryStores_corroboratedDelete = 
/** Send the server delete only after the wait, the cap, and a fresh re-check all clear. */
async function _SessionMemoryStores_corroboratedDelete(store, rel, remote, baseSha, deletes) {
    if (deletes.mode === 'disabled') {
        deletes.suppressed++;
        return baseSha;
    }
    let firstAbsent = store.pendingDeletes.get(rel);
    if (firstAbsent === undefined) {
        firstAbsent = Date.now();
        store.pendingDeletes.set(rel, firstAbsent);
    }
    if (!deletes.waiveWindow && Date.now() - firstAbsent < exports.DELETE_CORROBORATION_MS) {
        return baseSha;
    }
    let markerOk;
    let stillAbsent;
    try {
        // Re-check: the folder may have been wiped mid-sync.
        markerOk = (await store.files.hashFile(exports.MARKER_PATH)) === markerSha(store.memoryStoreId);
        stillAbsent = (await store.files.hashFile(rel)) === null;
    }
    catch (e) {
        if (!(e instanceof file_store_1.FileStoreError) && !isErrno(e))
            throw e;
        markerOk = stillAbsent = false;
    }
    if (!markerOk)
        return baseSha;
    if (!stillAbsent) {
        store.pendingDeletes.delete(rel);
        return baseSha;
    }
    if (!deletes.takeSlot())
        return baseSha;
    if (deletes.mode === 'log_only') {
        // Repeats each sync — the log is the dry run.
        tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").info('log-only: sync would delete this memory on the server', {
            path: rel,
            memory_store_id: store.memoryStoreId,
        });
        return baseSha;
    }
    const sha = await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_deleteRemote).call(this, store, rel, remote, baseSha);
    if (sha === undefined) {
        store.pendingDeletes.delete(rel);
    }
    return sha;
}, _SessionMemoryStores_deleteRemote = async function _SessionMemoryStores_deleteRemote(store, rel, remote, baseSha) {
    try {
        await tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_client, "f").beta.memoryStores.memories.delete(remote.id, {
            memory_store_id: store.memoryStoreId,
            expected_content_sha256: baseSha,
        });
    }
    catch (e) {
        if ((0, backoff_1.isStatus)(e, 404))
            return undefined; // already gone remotely too
        if ((0, backoff_1.isStatus)(e, 409) || (0, backoff_1.isStatus)(e, 412)) {
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('memory deleted locally but changed remotely; keeping the remote version', {
                path: rel,
                memory_store_id: store.memoryStoreId,
            });
        }
        else {
            tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn('failed to delete memory', {
                path: rel,
                memory_store_id: store.memoryStoreId,
                error: String(e),
            });
        }
        return baseSha;
    }
    tslib_1.__classPrivateFieldGet(this, _SessionMemoryStores_log, "f").info('propagated local deletion', { path: rel, memory_store_id: store.memoryStoreId });
    return undefined;
};
/**
 * True for a thrown value shaped like a Node filesystem error. Shape-checked,
 * not `instanceof Error` — fs errors can come from another realm.
 */
function isErrno(e) {
    return typeof e === 'object' && e !== null && typeof e.code === 'string';
}
/**
 * Resolve when `p` settles, or as soon as `signal` aborts. A rejection from
 * `p` before the abort propagates; one after it is dropped.
 */
async function settledOrAborted(p, signal) {
    if (!signal) {
        await p;
        return;
    }
    let onAbort;
    const aborted = new Promise((resolve) => {
        onAbort = resolve;
        if (signal.aborted)
            resolve();
    });
    signal.addEventListener('abort', onAbort, { once: true });
    try {
        await Promise.race([p, aborted]);
    }
    finally {
        signal.removeEventListener('abort', onAbort);
    }
}
//# sourceMappingURL=memories.js.map