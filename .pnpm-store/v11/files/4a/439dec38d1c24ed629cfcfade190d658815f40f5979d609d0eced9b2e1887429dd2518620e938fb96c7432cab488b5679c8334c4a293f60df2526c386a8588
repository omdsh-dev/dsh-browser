/**
 * Browser stub for `tools/memory/node`.
 *
 * The real module's {@link BetaLocalFilesystemMemoryTool} is implemented on top
 * of Node built-ins (`fs/promises`, `path`, `crypto`), which browser bundlers
 * cannot resolve. The `browser` field in `package.json` substitutes this stub
 * in browser builds; Node runtimes and node-target bundles ignore the mapping
 * and load the real implementation.
 *
 * `betaMemoryTool` is runtime-agnostic and is re-exported for real here; only
 * the filesystem-backed handlers throw.
 */
export { betaMemoryTool } from "../../helpers/beta/memory.js";
export type { MemoryToolHandlers } from "../../helpers/beta/memory.js";
import type { MemoryToolHandlers } from "../../helpers/beta/memory.js";
import type { BetaMemoryTool20250818CreateCommand, BetaMemoryTool20250818DeleteCommand, BetaMemoryTool20250818InsertCommand, BetaMemoryTool20250818RenameCommand, BetaMemoryTool20250818StrReplaceCommand, BetaMemoryTool20250818ViewCommand } from "../../resources/beta.js";
export declare class BetaLocalFilesystemMemoryTool implements MemoryToolHandlers {
    constructor(_basePath?: string);
    static init(_basePath?: string): Promise<BetaLocalFilesystemMemoryTool>;
    view(_command: BetaMemoryTool20250818ViewCommand): Promise<string>;
    create(_command: BetaMemoryTool20250818CreateCommand): Promise<string>;
    str_replace(_command: BetaMemoryTool20250818StrReplaceCommand): Promise<string>;
    insert(_command: BetaMemoryTool20250818InsertCommand): Promise<string>;
    delete(_command: BetaMemoryTool20250818DeleteCommand): Promise<string>;
    rename(_command: BetaMemoryTool20250818RenameCommand): Promise<string>;
}
//# sourceMappingURL=node.browser.d.ts.map