"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.elfInterpreter = elfInterpreter;
exports.libcFromExecutable = libcFromExecutable;
exports.platformPackageSuffix = platformPackageSuffix;
exports.optionalPackageName = optionalPackageName;
exports.optionalBinaryRelativePath = optionalBinaryRelativePath;
exports.loadPrebuild = loadPrebuild;
exports.loadEntry = loadEntry;
exports.localBindingPath = localBindingPath;
exports.createEntryApi = createEntryApi;
const node_fs_1 = __importDefault(require("node:fs"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const NAPI_VERSION = '9';
const BINARY_NAME = 'require_builtin.node';
const BACKEND_AUTO = 'auto';
const BACKEND_NAPI = 'napi';
const BACKEND_NODEABI = 'nodeabi';
function errorMessage(error) {
    if (error instanceof Error)
        return error.message;
    if (error === undefined || error === null)
        return undefined;
    return String(error);
}
function nativeCacheEnabled() {
    return process.env.NARB_DISABLE_NATIVE_CACHE !== '1';
}
function nativeCacheRoot() {
    if (process.env.NARB_NATIVE_CACHE_DIR) {
        return process.env.NARB_NATIVE_CACHE_DIR;
    }
    if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
        return node_path_1.default.join(process.env.LOCALAPPDATA, 'node-addon-native-custom-loader', 'native-cache');
    }
    const uid = typeof process.getuid === 'function' ? String(process.getuid()) : 'nouid';
    return node_path_1.default.join(node_os_1.default.tmpdir(), `node-addon-native-custom-loader-${uid}`, 'native-cache');
}
function sha256(data) {
    return node_crypto_1.default.createHash('sha256').update(data).digest('hex');
}
function packageVersionForNativeBinary(sourcePath) {
    let dir = node_path_1.default.dirname(sourcePath);
    while (dir !== node_path_1.default.dirname(dir)) {
        const packageJson = node_path_1.default.join(dir, 'package.json');
        if (node_fs_1.default.existsSync(packageJson)) {
            try {
                const manifest = JSON.parse(node_fs_1.default.readFileSync(packageJson, 'utf8'));
                if (typeof manifest.version === 'string' && manifest.version.length > 0) {
                    return manifest.version;
                }
            }
            catch {
                return 'unknown-version';
            }
        }
        dir = node_path_1.default.dirname(dir);
    }
    return 'unknown-version';
}
function cachedFileMatches(destination, expectedDigest) {
    try {
        return sha256(node_fs_1.default.readFileSync(destination)) === expectedDigest;
    }
    catch {
        return false;
    }
}
function materializedNativeBinaryPath(sourcePath, packageName) {
    if (!nativeCacheEnabled())
        return sourcePath;
    try {
        const data = node_fs_1.default.readFileSync(sourcePath);
        const digest = sha256(data);
        const filename = node_path_1.default.basename(sourcePath);
        // The cache path is fully determined by package name, version, platform and
        // file name — never by the content digest. Those already namespace distinct
        // binaries, so a fixed layout keeps the path short (Windows MAX_PATH is 260)
        // and identical on every load. The digest is only used to verify integrity
        // of whatever already sits at that deterministic path.
        const destinationDir = node_path_1.default.join(nativeCacheRoot(), packageName.replace(/^@/, '').replace(/[\\/]/g, '-'), packageVersionForNativeBinary(sourcePath), platformPackageSuffix());
        const destination = node_path_1.default.join(destinationDir, filename);
        if (node_fs_1.default.existsSync(destination)) {
            // A cached file exists at the expected path. Trust it only if its content
            // hash matches the source; otherwise it is stale or corrupt, so refuse it
            // and load from the original directory instead.
            return cachedFileMatches(destination, digest) ? destination : sourcePath;
        }
        node_fs_1.default.mkdirSync(destinationDir, { recursive: true });
        const temp = node_path_1.default.join(destinationDir, `.${filename}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`);
        node_fs_1.default.writeFileSync(temp, data, {
            mode: node_fs_1.default.statSync(sourcePath).mode,
        });
        try {
            // Atomic "create if absent" on filesystems that support hard links.
            node_fs_1.default.linkSync(temp, destination);
            node_fs_1.default.rmSync(temp, { force: true });
            return destination;
        }
        catch {
            if (node_fs_1.default.existsSync(destination)) {
                node_fs_1.default.rmSync(temp, { force: true });
                return cachedFileMatches(destination, digest) ? destination : sourcePath;
            }
            // Some filesystems disallow hard links. Fall back to rename; if another
            // process won the race, keep its copy after verifying the digest.
            try {
                node_fs_1.default.renameSync(temp, destination);
                return cachedFileMatches(destination, digest) ? destination : sourcePath;
            }
            catch {
                if (node_fs_1.default.existsSync(destination)) {
                    node_fs_1.default.rmSync(temp, { force: true });
                    return cachedFileMatches(destination, digest) ? destination : sourcePath;
                }
                node_fs_1.default.rmSync(temp, { force: true });
                return sourcePath;
            }
        }
    }
    catch {
        return sourcePath;
    }
}
function normalizeBackend(value) {
    const backend = value || BACKEND_AUTO;
    if (backend === BACKEND_AUTO ||
        backend === BACKEND_NAPI ||
        backend === BACKEND_NODEABI) {
        return backend;
    }
    throw new Error(`unsupported native backend: ${value}`);
}
function normalizeBinaryBackend(value) {
    if (value === BACKEND_NAPI || value === BACKEND_NODEABI) {
        return value;
    }
    throw new Error(`unsupported native binary backend: ${value}`);
}
function buildAbiTag(selectedBackend, options = {}) {
    if (normalizeBinaryBackend(selectedBackend) === BACKEND_NAPI) {
        return `napi-v${options.napiVersion || NAPI_VERSION}`;
    }
    return `node-v${options.nodeModuleVersion || process.versions.modules}`;
}
function binaryTag(selectedBackend, options = {}) {
    if (normalizeBinaryBackend(selectedBackend) === BACKEND_NAPI) {
        return buildAbiTag(BACKEND_NAPI, options);
    }
    return `nodeabi-v${options.nodeModuleVersion || process.versions.modules}`;
}
const PT_INTERP = 3;
/**
 * Read the ELF program interpreter (PT_INTERP) path of an executable, or
 * return undefined when the file is not a parseable ELF64 little-endian
 * dynamic executable (static binaries have no PT_INTERP). Only the ELF64 LE
 * layout is parsed — every published Linux prebuild target (x64, arm64 glibc)
 * is ELF64 LE — and any structural anomaly returns undefined so the caller
 * falls back instead of trusting a guess.
 */
function elfInterpreter(executablePath) {
    let fd;
    try {
        fd = node_fs_1.default.openSync(executablePath, 'r');
    }
    catch {
        return undefined;
    }
    try {
        const header = Buffer.alloc(64);
        if (node_fs_1.default.readSync(fd, header, 0, header.length, 0) !== header.length)
            return undefined;
        if (header.readUInt32BE(0) !== 0x7f454c46)
            return undefined;
        if (header[4] !== 2 || header[5] !== 1)
            return undefined;
        const tableOffset = header.readBigUInt64LE(0x20);
        const entrySize = header.readUInt16LE(0x36);
        const entryCount = header.readUInt16LE(0x38);
        if (tableOffset > BigInt(Number.MAX_SAFE_INTEGER) || entrySize < 56 || entryCount === 0 || entryCount > 128) {
            return undefined;
        }
        const table = Buffer.alloc(entrySize * entryCount);
        if (node_fs_1.default.readSync(fd, table, 0, table.length, Number(tableOffset)) !== table.length)
            return undefined;
        for (let index = 0; index < entryCount; index += 1) {
            const entry = table.subarray(index * entrySize, (index + 1) * entrySize);
            if (entry.readUInt32LE(0) !== PT_INTERP)
                continue;
            const segmentOffset = entry.readBigUInt64LE(0x08);
            const segmentSize = entry.readBigUInt64LE(0x20);
            if (segmentOffset > BigInt(Number.MAX_SAFE_INTEGER) || segmentSize === 0n || segmentSize > 4096n) {
                return undefined;
            }
            const interpreter = Buffer.alloc(Number(segmentSize));
            if (node_fs_1.default.readSync(fd, interpreter, 0, interpreter.length, Number(segmentOffset)) !== interpreter.length) {
                return undefined;
            }
            const nul = interpreter.indexOf(0);
            return interpreter.toString('utf8', 0, nul === -1 ? interpreter.length : nul);
        }
        return undefined;
    }
    catch {
        return undefined;
    }
    finally {
        node_fs_1.default.closeSync(fd);
    }
}
/**
 * Classify an executable's libc family from its ELF interpreter name —
 * `ld-musl-*` is musl, `ld-linux*` is glibc — following symlinks so aliased
 * interpreters (e.g. Homebrew's `lib/ld.so` -> the system glibc loader)
 * classify by what they resolve to. Undefined when the executable is static,
 * unreadable, or its interpreter name matches neither family.
 */
function libcFromExecutable(executablePath) {
    const interpreter = elfInterpreter(executablePath);
    if (interpreter === undefined)
        return undefined;
    const candidates = [interpreter];
    try {
        candidates.push(node_fs_1.default.realpathSync(interpreter));
    }
    catch {
        // Interpreter path from the ELF image may not exist in this mount
        // namespace; classify from the raw name alone.
    }
    for (const candidate of candidates) {
        const base = node_path_1.default.basename(candidate);
        if (base.includes('musl'))
            return 'musl';
        if (base.startsWith('ld-linux'))
            return 'glibc';
    }
    return undefined;
}
/**
 * Classify the running process's libc family from its own memory mappings —
 * the mapped libc is authoritative for what the loaded addon must match.
 * Undefined when /proc is unavailable or no recognizable libc is mapped.
 */
function libcFromProcMaps() {
    let maps;
    try {
        maps = node_fs_1.default.readFileSync('/proc/self/maps', 'utf8');
    }
    catch {
        return undefined;
    }
    if (/\/ld-musl-|\/libc\.musl-/.test(maps))
        return 'musl';
    if (/\/libc\.so\.6|\/libc-2\.\d+\.so/.test(maps))
        return 'glibc';
    return undefined;
}
let linuxLibcResolved = false;
let cachedLinuxLibc;
function linuxLibc() {
    if (process.platform !== 'linux')
        return undefined;
    if (linuxLibcResolved)
        return cachedLinuxLibc;
    // Cheap signals first: the node binary's ELF interpreter, then the mapped
    // libc in /proc/self/maps. process.report.getReport() stays as the last
    // resort only (and keeps the pre-existing musl default when even it is
    // unavailable): its CPU enumeration opens every sysfs cpufreq entry with a
    // live frequency query, which takes seconds on many-CPU hosts — the reason
    // requiring this package could stall multi-CPU launches by seconds.
    cachedLinuxLibc = libcFromExecutable(process.execPath) ?? libcFromProcMaps();
    if (cachedLinuxLibc === undefined) {
        const report = process.report && typeof process.report.getReport === 'function'
            ? process.report.getReport()
            : null;
        cachedLinuxLibc = report && report.header && report.header.glibcVersionRuntime
            ? 'glibc'
            : 'musl';
    }
    linuxLibcResolved = true;
    return cachedLinuxLibc;
}
function runtimeSuffix() {
    if (process.platform === 'darwin')
        return `darwin-${process.arch}`;
    if (process.platform === 'linux') {
        const libc = linuxLibc() === 'glibc' ? 'gnu' : 'musl';
        return `linux-${process.arch}-${libc}`;
    }
    if (process.platform === 'win32')
        return `win32-${process.arch}-msvc`;
    return `${process.platform}-${process.arch}`;
}
function platformPackageSuffix() {
    return runtimeSuffix();
}
function optionalPackageName(packagePrefix) {
    return `${packagePrefix}-${platformPackageSuffix()}`;
}
function optionsForBackend(selectedBackend) {
    return normalizeBinaryBackend(selectedBackend) === BACKEND_NAPI
        ? { napiVersion: NAPI_VERSION }
        : { nodeModuleVersion: process.versions.modules };
}
function prebuiltFileName(selectedBackend, options = optionsForBackend(selectedBackend)) {
    return `${platformPackageSuffix()}-${binaryTag(selectedBackend, options)}.node`;
}
function optionalBinaryRelativePath(selectedBackend, options = optionsForBackend(selectedBackend)) {
    return `prebuilt/${prebuiltFileName(selectedBackend, options)}`;
}
function expectedBinary(selectedBackend) {
    const backend = normalizeBinaryBackend(selectedBackend);
    const options = optionsForBackend(backend);
    return {
        backend,
        abi: buildAbiTag(backend, options),
        path: optionalBinaryRelativePath(backend, options),
    };
}
function entryCandidateBinaries(backendPreference) {
    const nodeAbiBinary = expectedBinary(BACKEND_NODEABI);
    const napiBinary = expectedBinary(BACKEND_NAPI);
    if (backendPreference === BACKEND_NODEABI)
        return [nodeAbiBinary];
    if (backendPreference === BACKEND_NAPI)
        return [napiBinary];
    return [nodeAbiBinary, napiBinary];
}
function currentNodeAbi() {
    return `node-v${process.versions.modules}`;
}
function findBinary(prebuilds, backend, abi) {
    return prebuilds.binaries.find((binary) => binary.backend === backend && binary.abi === abi) || null;
}
function prebuildCandidateBinaries(prebuilds, backendPreference) {
    const nodeAbiBinary = findBinary(prebuilds, BACKEND_NODEABI, currentNodeAbi());
    const napiBinary = findBinary(prebuilds, BACKEND_NAPI, 'napi-v9');
    if (backendPreference === BACKEND_NODEABI) {
        return nodeAbiBinary ? [nodeAbiBinary] : [];
    }
    if (backendPreference === BACKEND_NAPI) {
        return napiBinary ? [napiBinary] : [];
    }
    return [nodeAbiBinary, napiBinary].filter((binary) => Boolean(binary));
}
function validateLoadedBinding(binding, bindingPath) {
    if (!binding) {
        throw new Error(`native binding did not export an object: ${bindingPath}`);
    }
    if (typeof binding.requireBuiltin !== 'function') {
        throw new Error(`native binding did not export requireBuiltin(): ${bindingPath}`);
    }
    if (typeof binding.isAllowedInternalId !== 'function') {
        throw new Error(`native binding did not export isAllowedInternalId(): ${bindingPath}`);
    }
    if (typeof binding.getNativeBindingInfo !== 'function') {
        throw new Error(`native binding did not export getNativeBindingInfo(): ${bindingPath}`);
    }
    const info = binding.getNativeBindingInfo();
    if (!info || typeof info !== 'object') {
        throw new Error(`native binding info is not an object: ${bindingPath}`);
    }
    if (typeof info.mode !== 'string' ||
        typeof info.backend !== 'string' ||
        typeof info.abi !== 'string') {
        throw new Error(`native binding info has invalid fields: ${bindingPath}`);
    }
    const backend = info.backend;
    if (backend !== BACKEND_NAPI && backend !== BACKEND_NODEABI) {
        throw new Error(`native binding has unsupported backend ${backend}: ${bindingPath}`);
    }
    const expected = buildAbiTag(backend, optionsForBackend(backend));
    if (info.abi !== expected) {
        throw new Error(`native binding ABI mismatch for ${bindingPath}: expected ${expected}, got ${info.abi}`);
    }
    Object.defineProperty(binding, 'nativeBindingInfo', {
        value: info,
        enumerable: false,
        configurable: true,
    });
    return binding;
}
function validatePrebuiltBinding(binding, binary, bindingPath) {
    validateLoadedBinding(binding, bindingPath);
    const info = binding.nativeBindingInfo;
    if (!info || info.backend !== binary.backend || info.abi !== binary.abi) {
        const actualBackend = info && info.backend;
        const actualAbi = info && info.abi;
        throw new Error(`prebuilt binary mismatch for ${bindingPath}: expected ${binary.backend} ${binary.abi}, got ${actualBackend} ${actualAbi}`);
    }
    Object.defineProperty(binding, 'bindingPath', {
        value: bindingPath,
        enumerable: false,
        configurable: true,
    });
    Object.defineProperty(binding, 'prebuild', {
        value: binary,
        enumerable: false,
        configurable: true,
    });
    return binding;
}
function loadPrebuild(packageDir, options = {}) {
    const packageName = require(node_path_1.default.join(packageDir, 'package.json')).name;
    const prebuilds = options.prebuilds || require(node_path_1.default.join(packageDir, 'prebuilds.json'));
    const backendPreference = normalizeBackend(options.backend || process.env.NARB_BACKEND);
    const candidates = prebuildCandidateBinaries(prebuilds, backendPreference);
    const attempts = [];
    if (candidates.length === 0) {
        const error = new Error(`No prebuilt binary candidate in ${prebuilds.platform} for ${backendPreference} ${currentNodeAbi()}`);
        error.attempts = attempts;
        throw error;
    }
    for (const binary of candidates) {
        const bindingPath = node_path_1.default.join(packageDir, binary.path);
        let loadPath = bindingPath;
        try {
            loadPath = materializedNativeBinaryPath(bindingPath, packageName);
            return validatePrebuiltBinding(require(loadPath), binary, loadPath);
        }
        catch (error) {
            attempts.push({
                path: bindingPath,
                loadPath,
                backend: binary.backend,
                abi: binary.abi,
                message: errorMessage(error),
            });
        }
    }
    const error = new Error(`No usable prebuilt binary found in ${prebuilds.platform}`);
    error.attempts = attempts;
    throw error;
}
function tryRequirePackage(candidate) {
    try {
        const binding = require(candidate.request);
        const bindingPath = binding.bindingPath || require.resolve(candidate.request);
        validateLoadedBinding(binding, bindingPath);
        return { binding, path: bindingPath, error: null };
    }
    catch (error) {
        return { binding: null, path: null, error };
    }
}
function tryRequireLocal(packageDir, binary) {
    const file = node_path_1.default.join(packageDir, 'build', binary.backend, `${binary.abi}-${platformPackageSuffix()}`, BINARY_NAME);
    try {
        const loadPath = materializedNativeBinaryPath(file, 'node-addon-native-custom-loader-local');
        const binding = require(loadPath);
        validateLoadedBinding(binding, loadPath);
        Object.defineProperty(binding, 'bindingPath', {
            value: loadPath,
            enumerable: false,
            configurable: true,
        });
        return { binding, path: file, loadPath, error: null };
    }
    catch (error) {
        return { binding: null, path: file, error };
    }
}
function pushAttempt(attempts, data) {
    attempts.push({
        ...data,
        message: errorMessage(data.error),
        attempts: data.error && typeof data.error === 'object' && 'attempts' in data.error
            ? data.error.attempts
            : undefined,
    });
}
function noUsableBindingError(packagePrefix, backendPreference, attempts) {
    const error = new Error(`No usable native binding found for ${optionalPackageName(packagePrefix)} (${backendPreference})`);
    error.attempts = attempts;
    return error;
}
function optionalPackageCandidates(packageDir, packagePrefix) {
    const candidates = [{
            request: optionalPackageName(packagePrefix),
            source: 'optional-package',
        }];
    const workspacePath = node_path_1.default.join(packageDir, '..', platformPackageSuffix());
    if (node_fs_1.default.existsSync(workspacePath)) {
        candidates.push({
            request: workspacePath,
            source: 'optional-package-workspace',
        });
    }
    return candidates;
}
function loadEntry(options) {
    const packageDir = options.packageDir;
    const packagePrefix = options.packagePrefix;
    const backendPreference = normalizeBackend(options.backend || process.env.NARB_BACKEND);
    const attempts = [];
    if (process.env.NARB_DISABLE_OPTIONAL_PACKAGE !== '1') {
        for (const candidate of optionalPackageCandidates(packageDir, packagePrefix)) {
            const result = tryRequirePackage(candidate);
            if (result.binding && result.path) {
                return {
                    binding: result.binding,
                    path: result.path,
                    source: candidate.source,
                    attempts,
                };
            }
            pushAttempt(attempts, {
                source: candidate.source,
                request: candidate.request,
                error: result.error,
            });
        }
    }
    if (process.env.NARB_DISABLE_LOCAL_BUILD === '1') {
        throw noUsableBindingError(packagePrefix, backendPreference, attempts);
    }
    for (const binary of entryCandidateBinaries(backendPreference)) {
        const result = tryRequireLocal(packageDir, binary);
        if (result.binding) {
            return {
                binding: result.binding,
                path: result.path,
                source: 'local-build',
                attempts,
            };
        }
        pushAttempt(attempts, {
            source: 'local-build',
            path: result.path,
            loadPath: result.loadPath,
            backend: binary.backend,
            abi: binary.abi,
            error: result.error,
        });
    }
    throw noUsableBindingError(packagePrefix, backendPreference, attempts);
}
function localBindingPath(packageDir, selectedBackend) {
    const backend = normalizeBinaryBackend(selectedBackend);
    const abi = buildAbiTag(backend, optionsForBackend(backend));
    return node_path_1.default.join(packageDir, 'build', backend, `${abi}-${platformPackageSuffix()}`, BINARY_NAME);
}
// Builds the public entry API for a family package. The package name (its own
// package.json `name`) is the prefix used to resolve the per-platform optional
// package, so both families share this one implementation and their entry
// index.ts becomes a single delegating call.
function createEntryApi(packageDir) {
    const packagePrefix = require(node_path_1.default.join(packageDir, 'package.json')).name;
    const loaded = loadEntry({ packageDir, packagePrefix });
    const binding = loaded.binding;
    let bindingInfo;
    return {
        requireBuiltin(moduleId) {
            return binding.requireBuiltin(moduleId);
        },
        isAllowedInternalId(moduleId) {
            return binding.isAllowedInternalId(moduleId);
        },
        getBindingInfo() {
            if (bindingInfo)
                return bindingInfo;
            const nativeInfo = binding.getNativeBindingInfo();
            bindingInfo = Object.freeze({
                mode: nativeInfo.mode,
                product: nativeInfo.product,
                backend: nativeInfo.backend,
                abi: nativeInfo.abi,
                bindingPath: loaded.path,
                bindingSource: loaded.source,
                localBindingPath: localBindingPath(packageDir, nativeInfo.backend),
                optionalPackageName: optionalPackageName(packagePrefix),
                optionalBinaryRelativePath: optionalBinaryRelativePath(nativeInfo.backend),
                platformPackageSuffix: platformPackageSuffix(),
            });
            return bindingInfo;
        },
    };
}
