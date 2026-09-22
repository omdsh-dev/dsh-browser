/**
 * Shared, Node-only filesystem helpers for the agent toolset's file tools:
 * path confinement (symlink-aware), an atomic write, and language-independent
 * error messages. Kept out of `node.ts` so the tool implementations stay focused
 * and these helpers can be reused by every file tool.
 */
/** Mode for directories the file tools create — not world-writable under a 0 umask. */
export declare const DIR_CREATE_MODE = 493;
/** Mode for files the file tools create. */
export declare const FILE_CREATE_MODE = 420;
/** True when `p` is `root` itself or lexically contained within it. */
export declare function isWithin(root: string, p: string): boolean;
/**
 * The first entry of `roots` whose canonical form contains the
 * already-canonical `target`, returned as configured; `undefined` when none
 * does. Each root goes through {@link canonicalize} at check time, exactly like
 * the workdir in {@link confineToRoot}, so granting access (`allowedRoots`)
 * and refusing writes (`readOnlyRoots`) can never resolve the same entry two
 * different ways.
 */
export declare function containingRoot(roots: readonly string[], target: string): Promise<string | undefined>;
/** The `code` of a Node system error, or `undefined` for anything else. */
export declare function errnoCode(err: unknown): string | undefined;
/**
 * Fully resolve `abs`: `realpath` the longest existing ancestor and re-append
 * the rest, but never re-append a component that is itself a symlink — read the
 * link and continue from its target instead. This handles paths being created
 * (write/edit) without letting a symlink leaf (e.g. a dangling one pointing
 * outside a confinement root) slip through unresolved.
 *
 * Returns a symlink-free path or throws an errno-carrying error (`ELOOP` for a
 * cycle or more than {@link MAX_SYMLINK_HOPS} links, the `lstat`/`realpath`
 * error for an unreadable component); it never returns `abs` unresolved. Only
 * symlink hops count against the cap, so any depth of not-yet-existing
 * directories still resolves.
 */
export declare function canonicalize(abs: string): Promise<string>;
/**
 * Resolve `p` against `root` and confine it to `root` or one of `allowedRoots`
 * (absolute paths, resolved at check time exactly like `root`).
 *
 * Absolute and relative inputs go through the same canonicalise-then-contain
 * check — an absolute path that lands inside a permitted root is accepted,
 * only paths that resolve *outside* all of them are rejected. Every symlink in
 * `p` (including the leaf, even a dangling one) is resolved before the
 * confinement check, and the resolved path is what the caller then operates
 * on, so a symlink inside `root` that points outside it can neither pass the
 * check nor be followed afterwards. `..` is collapsed lexically before any
 * symlink is followed. A path that cannot be resolved (symlink loop, unreadable
 * component) is rejected with a `ToolError` naming `p`, never the host's
 * absolute path.
 *
 * Residual TOCTOU: a component could still be swapped for a symlink between this
 * call and the eventual `fs` operation. Closing that fully needs per-component
 * `O_NOFOLLOW`/`openat`, which Node does not expose ergonomically; this is why a
 * sandbox is still recommended for the toolset as a whole.
 */
export declare function confineToRoot(root: string, p: string, opts?: {
    allowedRoots?: readonly string[];
}): Promise<string>;
/**
 * Atomically write `content` to `targetPath`: write a sibling temp file, fsync
 * it, then rename over the target. The rename is atomic on most filesystems, so
 * a crash mid-write never leaves the target half-written.
 */
export declare function atomicWriteFile(targetPath: string, content: string): Promise<void>;
/**
 * Map a thrown filesystem error to a consistent, language-independent message,
 * so the model sees the same wording regardless of the runtime (Node's raw
 * `ENOENT: no such file...` text would otherwise leak through). Codes we don't
 * special-case render as the bare code, never Node's message, which embeds the
 * host's absolute path.
 */
export declare function fsErrorMessage(err: unknown, file: string): string;
//# sourceMappingURL=fs-util.d.ts.map