/**
 * Node-only skill plumbing for the agent toolset: downloading a session
 * agent's skills into the workdir and extracting the archives. Kept in its own
 * file because it is a distinct concern from the tool implementations in
 * `node.ts` — distinct enough, and large enough, to review on its own.
 */
import type { AgentToolContext } from "./node.mjs";
/**
 * Download the session agent's skills into `{ctx.workdir}/skills/<name>/`.
 *
 * No-op (returns a no-op cleanup) unless `ctx.client` is set together with
 * `ctx.session` (or the deprecated `ctx.sessionId`). Reads the resolved agent
 * off the session and, for each skill, fetches its files via
 * `client.beta.skills.versions.download` and extracts the archive (a zip or
 * tar.* archive) into a directory named after the skill. A failure on one skill
 * is logged and does not block the others. Call this before starting the
 * session tool runner (e.g. right after the bash session / workdir is ready).
 *
 * Pass `ctx.session`. A session's resources cannot change while it runs, so the
 * caller fetches it once and shares that snapshot with the memory-store
 * download — the two can then never disagree about the attached resources.
 *
 * `ctx.sessionId` is deprecated: it costs an extra `sessions.retrieve` round
 * trip on every call, and a caller that uses it for both this and the
 * memory-store download fetches the session twice. It remains supported for
 * callers written before `session` existed.
 *
 * Returns a cleanup function that removes the skill directories this call
 * created — call it once the work item is done so downloaded skills do not
 * accumulate in the workdir across sessions.
 */
export declare function setupSkills(ctx: AgentToolContext): Promise<() => Promise<void>>;
/**
 * Pair an archive's name listing (`unzip -Z1` / `tar -tf`) with its typed
 * listing (`unzip -Z --h --t` / `tar -tvf`) and split the members into plain
 * (regular file or directory) and special (everything else). Special members
 * are excluded from extraction rather than rejected; the archive is refused
 * only when the two listings disagree in length or a special member's name
 * cannot be passed back to the CLI verbatim (see {@link canExcludeVerbatim}).
 */
export declare function classifyArchiveListing(cmd: 'unzip' | 'tar', names: string, typed: string): {
    plain: string[];
    special: string[];
};
/**
 * Walk `dir` with `lstat` semantics and reject anything that is not a regular
 * file or directory. Never follows a link and never descends into anything
 * but a real directory.
 */
export declare function assertOnlyPlainEntries(dir: string): Promise<void>;
/**
 * Extract a skill download (a zip or tar.* archive) into `dest`. Streams the
 * response body straight to a temp file beside `dest` (so the whole archive is
 * never buffered in memory — skills can contain large binaries), then shells out
 * to `unzip`/`tar` — consistent with the rest of the toolset, which already
 * invokes `bash` and `rg`. Both `unzip` and `tar` must be available on `PATH`; a
 * missing binary surfaces as a clear error (see {@link runArchiveTool}). Refuses
 * any member that would escape `dest` (zip-slip / tar-slip): skill archives
 * come from the API, but skills can be third-party. Members that are not a
 * regular file or directory (symlink, hardlink, device, fifo) are excluded
 * from extraction rather than rejected; an archive whose special members
 * cannot be excluded reliably is refused (see {@link classifyArchiveListing}).
 * `tar` matches exclusions unanchored, so a plain member sharing a special
 * member's name may be dropped too. The staging tree is verified to hold only
 * regular files and directories before anything is promoted into `dest`.
 *
 * The skill bundle's single wrapper directory is stripped: the archive is
 * extracted into a staging dir and the wrapper's contents are promoted into
 * `dest`, so files land at `dest/SKILL.md` rather than a doubled
 * `dest/<skill>/SKILL.md` (`unzip` has no `--strip-components`, so this is
 * done uniformly by staging + promote rather than per-tool flags).
 */
export declare function extractSkillArchive(resp: Response, dest: string): Promise<void>;
//# sourceMappingURL=skills.d.mts.map