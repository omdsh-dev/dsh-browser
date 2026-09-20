/**
 * `FileStore` — one confined folder; a relative path cannot escape it.
 *
 * Beta scope: symlinks are refused or skipped wherever the store meets them,
 * but there is no hardening against a process racing the store's own
 * syscalls; fsync durability, non-POSIX hosts, and read-size caps are out of
 * scope.
 */
/** A refused operation — input the store will not act on. OS errors propagate with their `.code`. */
export declare class FileStoreError extends Error {
    static readonly ESCAPES_ROOT = "escapes the store root";
    static readonly IS_A_SYMLINK = "is a symlink";
    static readonly NOT_A_FILE = "is not a regular file";
    static readonly NOT_A_DIRECTORY = "is not a directory";
    static readonly NOT_UTF8 = "is not valid utf-8";
    static readonly MOVE_DESTINATION_EXISTS = "already exists";
    readonly reason: string;
    readonly relPath: string;
    constructor(reason: string, relPath: string);
}
/**
 * The store's resolved root, and what {@link FileStore.dispose} will do to it.
 *
 * `removedOnDispose` is true when `open` found no root, so `dispose` removes
 * it. A root that was already there is someone else's — a pre-seeded mount, a
 * caller's workdir — and is kept.
 */
export type Root = {
    path: string;
    removedOnDispose: boolean;
};
/** Options for {@link FileStore.open} / {@link openFileStore}. */
export interface OpenFileStoreOptions {
    /**
     * Restrict the store to valid UTF-8 (default `false`): a `put` of binary
     * bytes and a `get` of a binary file are refused with
     * {@link FileStoreError}, so a caller that decodes what `get` returns can
     * never hit a decode error.
     */
    utf8?: boolean;
}
/** Resolve `root`; creates nothing — only {@link FileStore.createRoot} makes the folder. */
export declare function openFileStore(root: string, opts?: OpenFileStoreOptions): Promise<FileStore>;
/**
 * True for a path usable verbatim as a store location: absolute, with no `..`
 * components. Paths are judged in POSIX terms — they are wire values naming
 * locations inside a POSIX container, not host-native paths.
 */
export declare function isPathLegal(p: string): boolean;
/**
 * One confined folder of regular files.
 *
 * Every `relPath` is relative to the root (a leading `/` also means the root)
 * and refused with {@link FileStoreError} when it escapes. The store holds
 * regular files only: symlinks are refused on read and skipped by listings —
 * {@link findSymlinks} reports them. A `relPath` resolving to the root itself
 * is banned by this interface: `put` and `get` refuse it, `move` and `remove`
 * do nothing. A store opened with `utf8: true` refuses binary content the
 * same way — on `put` of such bytes and on `get` of such a file. Only
 * {@link createRoot} makes the root: writes create directories below it,
 * never the root itself, so a root removed while the store is open stays
 * removed and the write fails with `ENOENT`.
 */
export declare class FileStore {
    private readonly rootPath;
    /** True ⇒ this open created the root, so {@link dispose} removes it. */
    private readonly removedOnDispose;
    /** Set iff the store refuses non-UTF-8 content; {@link requireUtf8} decodes against it, on both put and get. */
    private readonly decoder;
    /** `hashtree`'s advisory cache; every hit re-validates against a fresh stat. */
    private readonly hashes;
    static isPathLegal: typeof isPathLegal;
    /** @internal — use {@link FileStore.open} / {@link openFileStore}. */
    constructor(root: string, removedOnDispose: boolean, utf8Only?: boolean);
    /** Resolve `root`; creates nothing — only {@link createRoot} makes the folder. */
    static open(root: string, opts?: OpenFileStoreOptions): Promise<FileStore>;
    /** Create the root directory and any missing ancestors; already existing is fine. */
    createRoot(): Promise<void>;
    /** The resolved root, and what {@link dispose} will do to it. */
    root(): Root;
    /**
     * Remove the root iff `open` created it; pre-existing roots are kept.
     *
     * Wired to `Symbol.asyncDispose` at runtime when the host provides it, so
     * `await using` works on engines with explicit resource management.
     */
    dispose(): Promise<void>;
    /**
     * Write `data` (`string` UTF-8 or bytes) atomically to the file at `relPath`.
     *
     * Missing directories below the root are created; a missing root is not —
     * the write fails with `ENOENT`.
     */
    put(relPath: string, data: string | Uint8Array, opts?: {
        executable?: boolean;
    }): Promise<void>;
    /** The file's bytes; `null` when absent. */
    get(relPath: string): Promise<Uint8Array | null>;
    /** The relative path of every file under the directory `under`. */
    ls(under?: string): Promise<Set<string>>;
    /**
     * Every symlink under `under` — listings skip them and reads refuse them,
     * so a caller that must know they exist asks here.
     */
    findSymlinks(under?: string): Promise<Set<string>>;
    /**
     * `{relPath: sha256Hex}` of every file under the directory `under`.
     *
     * Unchanged files — same size, mtime, and ctime since the last call —
     * reuse their recorded hash instead of being re-read.
     */
    hashtree(under?: string): Promise<Record<string, string>>;
    /** One file's sha256; `null` when absent. Shares {@link hashtree}'s cache. */
    hashFile(relPath: string): Promise<string | null>;
    /**
     * Rename `src` to `dst`; an existing `dst` is refused. The banned store
     * root as either end does nothing.
     */
    move(src: string, dst: string): Promise<void>;
    /** Delete a file or subtree; absent — and the banned store root — do nothing. */
    remove(relPath: string): Promise<void>;
    private resolveUnderRoot;
    private requireUtf8;
    private hashViaCache;
}
/** sha256 of a file's contents, streamed — constant memory on any file size. */
declare function hashFile(full: string): Promise<string>;
/** Test seam — the hasher, the trust margin, and the walk clock. @internal */
export declare const _internals: {
    hashFile: typeof hashFile;
    timestampTrustMarginNs: bigint;
    nowNs: () => bigint;
};
export declare const LocalFileStore: typeof FileStore;
export {};
//# sourceMappingURL=file-store.d.mts.map