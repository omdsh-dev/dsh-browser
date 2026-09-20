declare const BACKEND_AUTO = "auto";
declare const BACKEND_NAPI = "napi";
declare const BACKEND_NODEABI = "nodeabi";
export type NativeBackend = typeof BACKEND_NAPI | typeof BACKEND_NODEABI;
export type BackendPreference = NativeBackend | typeof BACKEND_AUTO;
interface BuildTagOptions {
    napiVersion?: string;
    nodeModuleVersion?: string;
}
interface PrebuiltBinary {
    backend: NativeBackend;
    abi: string;
    path: string;
}
interface PrebuildsManifest {
    platform: string;
    binaries: PrebuiltBinary[];
}
interface NativeBinding {
    requireBuiltin: (moduleId: string) => unknown;
    isAllowedInternalId: (moduleId: string) => boolean;
    getNativeBindingInfo: () => NativeBindingInfo;
    bindingPath?: string;
    nativeBindingInfo?: NativeBindingInfo;
    [key: string]: unknown;
}
interface NativeBindingInfo {
    mode: string;
    product: string;
    backend: string;
    abi: string;
}
interface Attempt {
    source?: string;
    request?: string;
    path?: string;
    loadPath?: string;
    backend?: string;
    abi?: string;
    message?: string;
    attempts?: unknown;
}
export interface LoadedBinding {
    binding: NativeBinding;
    path: string;
    source: string;
    attempts: Attempt[];
}
export interface LoadEntryOptions {
    packageDir: string;
    packagePrefix: string;
    backend?: string;
}
export interface LoadPrebuildOptions {
    backend?: string;
    prebuilds?: PrebuildsManifest;
}
/**
 * Read the ELF program interpreter (PT_INTERP) path of an executable, or
 * return undefined when the file is not a parseable ELF64 little-endian
 * dynamic executable (static binaries have no PT_INTERP). Only the ELF64 LE
 * layout is parsed — every published Linux prebuild target (x64, arm64 glibc)
 * is ELF64 LE — and any structural anomaly returns undefined so the caller
 * falls back instead of trusting a guess.
 */
export declare function elfInterpreter(executablePath: string): string | undefined;
/**
 * Classify an executable's libc family from its ELF interpreter name —
 * `ld-musl-*` is musl, `ld-linux*` is glibc — following symlinks so aliased
 * interpreters (e.g. Homebrew's `lib/ld.so` -> the system glibc loader)
 * classify by what they resolve to. Undefined when the executable is static,
 * unreadable, or its interpreter name matches neither family.
 */
export declare function libcFromExecutable(executablePath: string): 'glibc' | 'musl' | undefined;
export declare function platformPackageSuffix(): string;
export declare function optionalPackageName(packagePrefix: string): string;
export declare function optionalBinaryRelativePath(selectedBackend: string, options?: BuildTagOptions): string;
export declare function loadPrebuild(packageDir: string, options?: LoadPrebuildOptions): NativeBinding;
export declare function loadEntry(options: LoadEntryOptions): LoadedBinding;
export declare function localBindingPath(packageDir: string, selectedBackend: string): string;
export interface BindingInfo extends NativeBindingInfo {
    bindingPath: string;
    bindingSource: string;
    localBindingPath: string;
    optionalPackageName: string;
    optionalBinaryRelativePath: string;
    platformPackageSuffix: string;
}
export interface EntryApi {
    requireBuiltin(moduleId: string): unknown;
    isAllowedInternalId(moduleId: string): boolean;
    getBindingInfo(): Readonly<BindingInfo>;
}
export declare function createEntryApi(packageDir: string): EntryApi;
export {};
