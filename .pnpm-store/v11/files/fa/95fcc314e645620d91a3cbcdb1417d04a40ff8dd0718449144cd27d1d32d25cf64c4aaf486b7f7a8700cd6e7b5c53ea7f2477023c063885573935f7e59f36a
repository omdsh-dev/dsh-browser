const { homedir } = require("node:os");
const { sep, join } = require("node:path");
const { createHash } = require("node:crypto");
const { readFile: readFile$1 } = require("node:fs/promises");
const { IniSectionType } = require("@smithy/types");
const { normalizeProvider } = require("@smithy/core/client");
const { isValidHostLabel } = require("@smithy/core/transport");

class ProviderError extends Error {
    name = "ProviderError";
    tryNextLink;
    constructor(message, options = true) {
        let logger;
        let tryNextLink = true;
        if (typeof options === "boolean") {
            logger = undefined;
            tryNextLink = options;
        }
        else if (options != null && typeof options === "object") {
            logger = options.logger;
            tryNextLink = options.tryNextLink ?? true;
        }
        super(message);
        this.tryNextLink = tryNextLink;
        Object.setPrototypeOf(this, ProviderError.prototype);
        logger?.debug?.(`@smithy/property-provider ${tryNextLink ? "->" : "(!)"} ${message}`);
    }
    static from(error, options = true) {
        return Object.assign(new this(error.message, options), error);
    }
}

class CredentialsProviderError extends ProviderError {
    name = "CredentialsProviderError";
    constructor(message, options = true) {
        super(message, options);
        Object.setPrototypeOf(this, CredentialsProviderError.prototype);
    }
}

class TokenProviderError extends ProviderError {
    name = "TokenProviderError";
    constructor(message, options = true) {
        super(message, options);
        Object.setPrototypeOf(this, TokenProviderError.prototype);
    }
}

const chain = (...providers) => async () => {
    if (providers.length === 0) {
        throw new ProviderError("No providers in chain");
    }
    let lastProviderError;
    for (const provider of providers) {
        try {
            const credentials = await provider();
            return credentials;
        }
        catch (err) {
            lastProviderError = err;
            if (err?.tryNextLink) {
                continue;
            }
            throw err;
        }
    }
    throw lastProviderError;
};

const fromValue = (staticValue) => () => Promise.resolve(staticValue);

const memoize = (provider, isExpired, requiresRefresh) => {
    let resolved;
    let pending;
    let hasResult;
    let isConstant = false;
    const coalesceProvider = async () => {
        if (!pending) {
            pending = provider();
        }
        try {
            resolved = await pending;
            hasResult = true;
            isConstant = false;
        }
        finally {
            pending = undefined;
        }
        return resolved;
    };
    if (isExpired === undefined) {
        return async (options) => {
            if (!hasResult || options?.forceRefresh) {
                resolved = await coalesceProvider();
            }
            return resolved;
        };
    }
    return async (options) => {
        if (!hasResult || options?.forceRefresh) {
            resolved = await coalesceProvider();
        }
        if (isConstant) {
            return resolved;
        }
        if (requiresRefresh && !requiresRefresh(resolved)) {
            isConstant = true;
            return resolved;
        }
        if (isExpired(resolved)) {
            await coalesceProvider();
            return resolved;
        }
        return resolved;
    };
};

const booleanSelector = (obj, key, type) => {
    if (!(key in obj))
        return undefined;
    if (obj[key] === "true")
        return true;
    if (obj[key] === "false")
        return false;
    throw new Error(`Cannot load ${type} "${key}". Expected "true" or "false", got ${obj[key]}.`);
};

const numberSelector = (obj, key, type) => {
    if (!(key in obj))
        return undefined;
    const numberValue = parseInt(obj[key], 10);
    if (Number.isNaN(numberValue)) {
        throw new TypeError(`Cannot load ${type} '${key}'. Expected number, got '${obj[key]}'.`);
    }
    return numberValue;
};

var SelectorType;
(function (SelectorType) {
    SelectorType["ENV"] = "env";
    SelectorType["CONFIG"] = "shared config entry";
})(SelectorType || (SelectorType = {}));

const homeDirCache = {};
const getHomeDirCacheKey = () => {
    if (process && process.geteuid) {
        return `${process.geteuid()}`;
    }
    return "DEFAULT";
};
const getHomeDir = () => {
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${sep}` } = process.env;
    if (HOME)
        return HOME;
    if (USERPROFILE)
        return USERPROFILE;
    if (HOMEPATH)
        return `${HOMEDRIVE}${HOMEPATH}`;
    const homeDirCacheKey = getHomeDirCacheKey();
    if (!homeDirCache[homeDirCacheKey])
        homeDirCache[homeDirCacheKey] = homedir();
    return homeDirCache[homeDirCacheKey];
};

const ENV_PROFILE = "AWS_PROFILE";
const DEFAULT_PROFILE = "default";
const getProfileName = (init) => init.profile || process.env[ENV_PROFILE] || DEFAULT_PROFILE;

const getSSOTokenFilepath = (id) => {
    const hasher = createHash("sha1");
    const cacheName = hasher.update(id).digest("hex");
    return join(getHomeDir(), ".aws", "sso", "cache", `${cacheName}.json`);
};

const tokenIntercept = {};
const getSSOTokenFromFile = async (id) => {
    if (tokenIntercept[id]) {
        return tokenIntercept[id];
    }
    const ssoTokenFilepath = getSSOTokenFilepath(id);
    const ssoTokenText = await readFile$1(ssoTokenFilepath, "utf8");
    return JSON.parse(ssoTokenText);
};

const CONFIG_PREFIX_SEPARATOR = ".";

const getConfigData = (data) => Object.entries(data)
    .filter(([key]) => {
    const indexOfSeparator = key.indexOf(CONFIG_PREFIX_SEPARATOR);
    if (indexOfSeparator === -1) {
        return false;
    }
    return Object.values(IniSectionType).includes(key.substring(0, indexOfSeparator));
})
    .reduce((acc, [key, value]) => {
    const indexOfSeparator = key.indexOf(CONFIG_PREFIX_SEPARATOR);
    const updatedKey = key.substring(0, indexOfSeparator) === IniSectionType.PROFILE ? key.substring(indexOfSeparator + 1) : key;
    acc[updatedKey] = value;
    return acc;
}, {
    ...(data.default && { default: data.default }),
});

const ENV_CONFIG_PATH = "AWS_CONFIG_FILE";
const getConfigFilepath = () => process.env[ENV_CONFIG_PATH] || join(getHomeDir(), ".aws", "config");

const ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
const getCredentialsFilepath = () => process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "credentials");

const prefixKeyRegex = /^([\w-]+)\s(["'])?([\w-@+.%:/]+)\2$/;
const profileNameBlockList = ["__proto__", "profile __proto__"];
const parseIni = (iniData) => {
    const map = {};
    let currentSection;
    let currentSubSection;
    for (const iniLine of iniData.split(/\r?\n/)) {
        const trimmedLine = iniLine.split(/(^|\s)[;#]/)[0].trim();
        const isSection = trimmedLine[0] === "[" && trimmedLine[trimmedLine.length - 1] === "]";
        if (isSection) {
            currentSection = undefined;
            currentSubSection = undefined;
            const sectionName = trimmedLine.substring(1, trimmedLine.length - 1);
            const matches = prefixKeyRegex.exec(sectionName);
            if (matches) {
                const [, prefix, , name] = matches;
                if (Object.values(IniSectionType).includes(prefix)) {
                    currentSection = [prefix, name].join(CONFIG_PREFIX_SEPARATOR);
                }
            }
            else {
                currentSection = sectionName;
            }
            if (profileNameBlockList.includes(sectionName)) {
                throw new Error(`Found invalid profile name "${sectionName}"`);
            }
        }
        else if (currentSection) {
            const indexOfEqualsSign = trimmedLine.indexOf("=");
            if (![0, -1].includes(indexOfEqualsSign)) {
                const [name, value] = [
                    trimmedLine.substring(0, indexOfEqualsSign).trim(),
                    trimmedLine.substring(indexOfEqualsSign + 1).trim(),
                ];
                if (value === "") {
                    currentSubSection = name;
                }
                else {
                    if (currentSubSection && iniLine.trimStart() === iniLine) {
                        currentSubSection = undefined;
                    }
                    map[currentSection] = map[currentSection] || {};
                    const key = currentSubSection ? [currentSubSection, name].join(CONFIG_PREFIX_SEPARATOR) : name;
                    map[currentSection][key] = value;
                }
            }
        }
    }
    return map;
};

const filePromises = {};
const fileIntercept = {};
const readFile = (path, options) => {
    if (fileIntercept[path] !== undefined) {
        return fileIntercept[path];
    }
    if (!filePromises[path] || options?.ignoreCache) {
        filePromises[path] = readFile$1(path, "utf8");
    }
    return filePromises[path];
};

const swallowError$1 = () => ({});
const loadSharedConfigFiles = async (init = {}) => {
    const { filepath = getCredentialsFilepath(), configFilepath = getConfigFilepath() } = init;
    const homeDir = getHomeDir();
    const relativeHomeDirPrefix = "~/";
    let resolvedFilepath = filepath;
    if (filepath.startsWith(relativeHomeDirPrefix)) {
        resolvedFilepath = join(homeDir, filepath.slice(2));
    }
    let resolvedConfigFilepath = configFilepath;
    if (configFilepath.startsWith(relativeHomeDirPrefix)) {
        resolvedConfigFilepath = join(homeDir, configFilepath.slice(2));
    }
    const parsedFiles = await Promise.all([
        readFile(resolvedConfigFilepath, {
            ignoreCache: init.ignoreCache,
        })
            .then(parseIni)
            .then(getConfigData)
            .catch(swallowError$1),
        readFile(resolvedFilepath, {
            ignoreCache: init.ignoreCache,
        })
            .then(parseIni)
            .catch(swallowError$1),
    ]);
    return {
        configFile: parsedFiles[0],
        credentialsFile: parsedFiles[1],
    };
};

const getSsoSessionData = (data) => Object.entries(data)
    .filter(([key]) => key.startsWith(IniSectionType.SSO_SESSION + CONFIG_PREFIX_SEPARATOR))
    .reduce((acc, [key, value]) => ({ ...acc, [key.substring(key.indexOf(CONFIG_PREFIX_SEPARATOR) + 1)]: value }), {});

const swallowError = () => ({});
const loadSsoSessionData = async (init = {}) => readFile(init.configFilepath ?? getConfigFilepath())
    .then(parseIni)
    .then(getSsoSessionData)
    .catch(swallowError);

const mergeConfigFiles = (...files) => {
    const merged = {};
    for (const file of files) {
        for (const [key, values] of Object.entries(file)) {
            if (merged[key] !== undefined) {
                Object.assign(merged[key], values);
            }
            else {
                merged[key] = values;
            }
        }
    }
    return merged;
};

const parseKnownFiles = async (init) => {
    const parsedFiles = await loadSharedConfigFiles(init);
    return mergeConfigFiles(parsedFiles.configFile, parsedFiles.credentialsFile);
};

const externalDataInterceptor = {
    getFileRecord() {
        return fileIntercept;
    },
    interceptFile(path, contents) {
        fileIntercept[path] = Promise.resolve(contents);
    },
    getTokenRecord() {
        return tokenIntercept;
    },
    interceptToken(id, contents) {
        tokenIntercept[id] = contents;
    },
};

function getSelectorName(functionString) {
    try {
        const constants = new Set(Array.from(functionString.match(/([A-Z_]){3,}/g) ?? []));
        constants.delete("CONFIG");
        constants.delete("CONFIG_PREFIX_SEPARATOR");
        constants.delete("ENV");
        return [...constants].join(", ");
    }
    catch (ignored) {
        return functionString;
    }
}

const fromEnv = (envVarSelector, options) => async () => {
    try {
        const config = envVarSelector(process.env, options);
        if (config === undefined) {
            throw new Error();
        }
        return config;
    }
    catch (e) {
        throw new CredentialsProviderError(e.message || `Not found in ENV: ${getSelectorName(envVarSelector.toString())}`, { logger: options?.logger });
    }
};

const fromSharedConfigFiles = (configSelector, { preferredFile = "config", ...init } = {}) => async () => {
    const profile = getProfileName(init);
    const { configFile, credentialsFile } = await loadSharedConfigFiles(init);
    const profileFromCredentials = credentialsFile[profile] || {};
    const profileFromConfig = configFile[profile] || {};
    const mergedProfile = preferredFile === "config"
        ? { ...profileFromCredentials, ...profileFromConfig }
        : { ...profileFromConfig, ...profileFromCredentials };
    try {
        const cfgFile = preferredFile === "config" ? configFile : credentialsFile;
        const configValue = configSelector(mergedProfile, cfgFile);
        if (configValue === undefined) {
            throw new Error();
        }
        return configValue;
    }
    catch (e) {
        throw new CredentialsProviderError(e.message || `Not found in config files w/ profile [${profile}]: ${getSelectorName(configSelector.toString())}`, { logger: init.logger });
    }
};

const isFunction = (func) => typeof func === "function";
const fromStatic = (defaultValue) => isFunction(defaultValue) ? async () => await defaultValue() : fromValue(defaultValue);

const loadConfig = ({ environmentVariableSelector, configFileSelector, default: defaultValue }, configuration = {}) => {
    const { signingName, logger } = configuration;
    const envOptions = { signingName, logger };
    return memoize(chain(fromEnv(environmentVariableSelector, envOptions), fromSharedConfigFiles(configFileSelector, configuration), fromStatic(defaultValue)));
};

const ENV_USE_DUALSTACK_ENDPOINT = "AWS_USE_DUALSTACK_ENDPOINT";
const CONFIG_USE_DUALSTACK_ENDPOINT = "use_dualstack_endpoint";
const DEFAULT_USE_DUALSTACK_ENDPOINT = false;
const NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => booleanSelector(env, ENV_USE_DUALSTACK_ENDPOINT, SelectorType.ENV),
    configFileSelector: (profile) => booleanSelector(profile, CONFIG_USE_DUALSTACK_ENDPOINT, SelectorType.CONFIG),
    default: false,
};
const nodeDualstackConfigSelectors = {
    environmentVariableSelector: (env) => booleanSelector(env, ENV_USE_DUALSTACK_ENDPOINT, SelectorType.ENV),
    configFileSelector: (profile) => booleanSelector(profile, CONFIG_USE_DUALSTACK_ENDPOINT, SelectorType.CONFIG),
    default: undefined,
};

const ENV_USE_FIPS_ENDPOINT = "AWS_USE_FIPS_ENDPOINT";
const CONFIG_USE_FIPS_ENDPOINT = "use_fips_endpoint";
const DEFAULT_USE_FIPS_ENDPOINT = false;
const NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => booleanSelector(env, ENV_USE_FIPS_ENDPOINT, SelectorType.ENV),
    configFileSelector: (profile) => booleanSelector(profile, CONFIG_USE_FIPS_ENDPOINT, SelectorType.CONFIG),
    default: false,
};
const nodeFipsConfigSelectors = {
    environmentVariableSelector: (env) => booleanSelector(env, ENV_USE_FIPS_ENDPOINT, SelectorType.ENV),
    configFileSelector: (profile) => booleanSelector(profile, CONFIG_USE_FIPS_ENDPOINT, SelectorType.CONFIG),
    default: undefined,
};

const resolveCustomEndpointsConfig = (input) => {
    const { tls, endpoint, urlParser, useDualstackEndpoint } = input;
    return Object.assign(input, {
        tls: tls ?? true,
        endpoint: normalizeProvider(typeof endpoint === "string" ? urlParser(endpoint) : endpoint),
        isCustomEndpoint: true,
        useDualstackEndpoint: normalizeProvider(useDualstackEndpoint ?? false),
    });
};

const getEndpointFromRegion = async (input) => {
    const { tls = true } = input;
    const region = await input.region();
    const dnsHostRegex = new RegExp(/^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$/);
    if (!dnsHostRegex.test(region)) {
        throw new Error("Invalid region in client config");
    }
    const useDualstackEndpoint = await input.useDualstackEndpoint();
    const useFipsEndpoint = await input.useFipsEndpoint();
    const { hostname } = (await input.regionInfoProvider(region, { useDualstackEndpoint, useFipsEndpoint })) ?? {};
    if (!hostname) {
        throw new Error("Cannot resolve hostname from client config");
    }
    return input.urlParser(`${tls ? "https:" : "http:"}//${hostname}`);
};

const resolveEndpointsConfig = (input) => {
    const useDualstackEndpoint = normalizeProvider(input.useDualstackEndpoint ?? false);
    const { endpoint, useFipsEndpoint, urlParser, tls } = input;
    return Object.assign(input, {
        tls: tls ?? true,
        endpoint: endpoint
            ? normalizeProvider(typeof endpoint === "string" ? urlParser(endpoint) : endpoint)
            : () => getEndpointFromRegion({ ...input, useDualstackEndpoint, useFipsEndpoint }),
        isCustomEndpoint: !!endpoint,
        useDualstackEndpoint,
    });
};

const AWS_EXECUTION_ENV = "AWS_EXECUTION_ENV";
const AWS_REGION_ENV = "AWS_REGION";
const AWS_DEFAULT_REGION_ENV = "AWS_DEFAULT_REGION";
const ENV_IMDS_DISABLED = "AWS_EC2_METADATA_DISABLED";
const DEFAULTS_MODE_OPTIONS = ["in-region", "cross-region", "mobile", "standard", "legacy"];
const IMDS_REGION_PATH = "/latest/meta-data/placement/region";
const IMDS_TOKEN_PATH = "/latest/api/token";
const X_AWS_EC2_METADATA_TOKEN = "x-aws-ec2-metadata-token";
const X_AWS_EC2_METADATA_TOKEN_TTL = "x-aws-ec2-metadata-token-ttl-seconds";

const TIMEOUT_MS = 1000;
const NEG_CACHE_TTL_MS = 60_000;
let negativeCacheUntil = 0;
const getInstanceMetadataRegion = async () => {
    if (process.env[ENV_IMDS_DISABLED]) {
        return undefined;
    }
    if (Date.now() < negativeCacheUntil) {
        return undefined;
    }
    try {
        const endpoint = resolveImdsEndpoint();
        const token = (await imdsRequest({
            ...endpoint,
            path: IMDS_TOKEN_PATH,
            method: "PUT",
            headers: {
                [X_AWS_EC2_METADATA_TOKEN_TTL]: "21600",
            },
        })).toString();
        const region = (await imdsRequest({
            ...endpoint,
            path: IMDS_REGION_PATH,
            method: "GET",
            headers: {
                [X_AWS_EC2_METADATA_TOKEN]: token,
            },
        }))
            .toString()
            .trim();
        return region || cacheNegativeAndReturnUndefined();
    }
    catch {
        return cacheNegativeAndReturnUndefined();
    }
};
const cacheNegativeAndReturnUndefined = () => {
    negativeCacheUntil = Date.now() + NEG_CACHE_TTL_MS;
    return undefined;
};
const resolveImdsEndpoint = () => {
    const envEndpoint = process.env.AWS_EC2_METADATA_SERVICE_ENDPOINT;
    if (envEndpoint) {
        const url = new URL(envEndpoint);
        return {
            hostname: url.hostname.replace(/^\[(.+)]$/, "$1"),
            port: url.port ? Number(url.port) : undefined,
        };
    }
    if (process.env.AWS_EC2_METADATA_SERVICE_ENDPOINT_MODE === "IPv6") {
        return { hostname: "fd00:ec2::254" };
    }
    return { hostname: "169.254.169.254" };
};
const imdsRequest = async (options) => {
    const { request } = require('node:http');
    return new Promise((resolve, reject) => {
        const req = request({
            hostname: options.hostname,
            port: options.port,
            path: options.path,
            method: options.method,
            headers: options.headers,
            timeout: TIMEOUT_MS,
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        req.on("error", (err) => {
            reject(err);
            req.destroy();
        });
        req.on("timeout", () => {
            reject(new Error("TimeoutError from instance metadata service"));
            req.destroy();
        });
        req.on("response", (res) => {
            const { statusCode = 400 } = res;
            if (statusCode < 200 || statusCode >= 300) {
                reject(Object.assign(new Error("Error response received from instance metadata service"), { statusCode }));
                req.destroy();
                return;
            }
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                resolve(Buffer.concat(chunks));
                req.destroy();
            });
        });
        req.end();
    });
};

const REGION_ENV_NAME = "AWS_REGION";
const REGION_INI_NAME = "region";
const NODE_REGION_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => env[REGION_ENV_NAME],
    configFileSelector: (profile) => profile[REGION_INI_NAME],
    default: async () => {
        const region = await getInstanceMetadataRegion();
        if (region) {
            return region;
        }
        throw new Error("Region is missing");
    },
};
const NODE_REGION_CONFIG_FILE_OPTIONS = {
    preferredFile: "credentials",
};

const validRegions = new Set();
const checkRegion = (region, check = isValidHostLabel) => {
    if (!validRegions.has(region) && !check(region)) {
        if (region === "*") {
            console.warn(`@smithy/config-resolver WARN - Please use the caller region instead of "*". See "sigv4a" in https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/CLIENTS.md.`);
        }
        else {
            throw new Error(`Region not accepted: region="${region}" is not a valid hostname component.`);
        }
    }
    else {
        validRegions.add(region);
    }
};

const isFipsRegion = (region) => typeof region === "string" && (region.startsWith("fips-") || region.endsWith("-fips"));

const getRealRegion = (region) => isFipsRegion(region)
    ? ["fips-aws-global", "aws-fips"].includes(region)
        ? "us-east-1"
        : region.replace(/fips-(dkr-|prod-)?|-fips/, "")
    : region;

const resolveRegionConfig = (input) => {
    const { region, useFipsEndpoint } = input;
    if (!region) {
        throw new Error("Region is missing");
    }
    return Object.assign(input, {
        region: async () => {
            const providedRegion = typeof region === "function" ? await region() : region;
            const realRegion = getRealRegion(providedRegion);
            checkRegion(realRegion);
            return realRegion;
        },
        useFipsEndpoint: async () => {
            const providedRegion = typeof region === "string" ? region : await region();
            if (isFipsRegion(providedRegion)) {
                return true;
            }
            return typeof useFipsEndpoint !== "function" ? Promise.resolve(!!useFipsEndpoint) : useFipsEndpoint();
        },
    });
};

const getHostnameFromVariants = (variants = [], { useFipsEndpoint, useDualstackEndpoint }) => variants.find(({ tags }) => useFipsEndpoint === tags.includes("fips") && useDualstackEndpoint === tags.includes("dualstack"))?.hostname;

const getResolvedHostname = (resolvedRegion, { regionHostname, partitionHostname }) => regionHostname
    ? regionHostname
    : partitionHostname
        ? partitionHostname.replace("{region}", resolvedRegion)
        : undefined;

const getResolvedPartition = (region, { partitionHash }) => Object.keys(partitionHash || {}).find((key) => partitionHash[key].regions.includes(region)) ?? "aws";

const getResolvedSigningRegion = (hostname, { signingRegion, regionRegex, useFipsEndpoint }) => {
    if (signingRegion) {
        return signingRegion;
    }
    else if (useFipsEndpoint) {
        const regionRegexJs = regionRegex.replace("\\\\", "\\").replace(/^\^/g, "\\.").replace(/\$$/g, "\\.");
        const regionRegexmatchArray = hostname.match(regionRegexJs);
        if (regionRegexmatchArray) {
            return regionRegexmatchArray[0].slice(1, -1);
        }
    }
};

const getRegionInfo = (region, { useFipsEndpoint = false, useDualstackEndpoint = false, signingService, regionHash, partitionHash, }) => {
    const partition = getResolvedPartition(region, { partitionHash });
    const resolvedRegion = region in regionHash ? region : (partitionHash[partition]?.endpoint ?? region);
    const hostnameOptions = { useFipsEndpoint, useDualstackEndpoint };
    const regionHostname = getHostnameFromVariants(regionHash[resolvedRegion]?.variants, hostnameOptions);
    const partitionHostname = getHostnameFromVariants(partitionHash[partition]?.variants, hostnameOptions);
    const hostname = getResolvedHostname(resolvedRegion, { regionHostname, partitionHostname });
    if (hostname === undefined) {
        throw new Error(`Endpoint resolution failed for: ${{ resolvedRegion, useFipsEndpoint, useDualstackEndpoint }}`);
    }
    const signingRegion = getResolvedSigningRegion(hostname, {
        signingRegion: regionHash[resolvedRegion]?.signingRegion,
        regionRegex: partitionHash[partition].regionRegex,
        useFipsEndpoint,
    });
    return {
        partition,
        signingService,
        hostname,
        ...(signingRegion && { signingRegion }),
        ...(regionHash[resolvedRegion]?.signingService && {
            signingService: regionHash[resolvedRegion].signingService,
        }),
    };
};

const AWS_DEFAULTS_MODE_ENV = "AWS_DEFAULTS_MODE";
const AWS_DEFAULTS_MODE_CONFIG = "defaults_mode";
const NODE_DEFAULTS_MODE_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => {
        return env[AWS_DEFAULTS_MODE_ENV];
    },
    configFileSelector: (profile) => {
        return profile[AWS_DEFAULTS_MODE_CONFIG];
    },
    default: "legacy",
};

const resolveDefaultsModeConfig = ({ region = loadConfig(NODE_REGION_CONFIG_OPTIONS), defaultsMode = loadConfig(NODE_DEFAULTS_MODE_CONFIG_OPTIONS), } = {}) => memoize(async () => {
    const mode = typeof defaultsMode === "function" ? await defaultsMode() : defaultsMode;
    switch (mode?.toLowerCase()) {
        case "auto":
            return resolveNodeDefaultsModeAuto(region);
        case "in-region":
        case "cross-region":
        case "mobile":
        case "standard":
        case "legacy":
            return Promise.resolve(mode?.toLocaleLowerCase());
        case undefined:
            return Promise.resolve("legacy");
        default:
            throw new Error(`Invalid parameter for "defaultsMode", expect ${DEFAULTS_MODE_OPTIONS.join(", ")}, got ${mode}`);
    }
});
const resolveNodeDefaultsModeAuto = async (clientRegion) => {
    if (clientRegion) {
        const resolvedRegion = typeof clientRegion === "function" ? await clientRegion() : clientRegion;
        const inferredRegion = await inferPhysicalRegion();
        if (!inferredRegion) {
            return "standard";
        }
        if (resolvedRegion === inferredRegion) {
            return "in-region";
        }
        else {
            return "cross-region";
        }
    }
    return "standard";
};
const inferPhysicalRegion = async () => {
    if (process.env[AWS_EXECUTION_ENV] && (process.env[AWS_REGION_ENV] || process.env[AWS_DEFAULT_REGION_ENV])) {
        return process.env[AWS_REGION_ENV] ?? process.env[AWS_DEFAULT_REGION_ENV];
    }
    return getInstanceMetadataRegion();
};

exports.CONFIG_PREFIX_SEPARATOR = CONFIG_PREFIX_SEPARATOR;
exports.CONFIG_USE_DUALSTACK_ENDPOINT = CONFIG_USE_DUALSTACK_ENDPOINT;
exports.CONFIG_USE_FIPS_ENDPOINT = CONFIG_USE_FIPS_ENDPOINT;
exports.CredentialsProviderError = CredentialsProviderError;
exports.DEFAULT_PROFILE = DEFAULT_PROFILE;
exports.DEFAULT_USE_DUALSTACK_ENDPOINT = DEFAULT_USE_DUALSTACK_ENDPOINT;
exports.DEFAULT_USE_FIPS_ENDPOINT = DEFAULT_USE_FIPS_ENDPOINT;
exports.ENV_PROFILE = ENV_PROFILE;
exports.ENV_USE_DUALSTACK_ENDPOINT = ENV_USE_DUALSTACK_ENDPOINT;
exports.ENV_USE_FIPS_ENDPOINT = ENV_USE_FIPS_ENDPOINT;
exports.NODE_REGION_CONFIG_FILE_OPTIONS = NODE_REGION_CONFIG_FILE_OPTIONS;
exports.NODE_REGION_CONFIG_OPTIONS = NODE_REGION_CONFIG_OPTIONS;
exports.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS = NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS;
exports.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS = NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS;
exports.ProviderError = ProviderError;
exports.REGION_ENV_NAME = REGION_ENV_NAME;
exports.REGION_INI_NAME = REGION_INI_NAME;
exports.SelectorType = SelectorType;
exports.TokenProviderError = TokenProviderError;
exports.booleanSelector = booleanSelector;
exports.chain = chain;
exports.externalDataInterceptor = externalDataInterceptor;
exports.fromStatic = fromStatic;
exports.fromValue = fromValue;
exports.getHomeDir = getHomeDir;
exports.getProfileName = getProfileName;
exports.getRegionInfo = getRegionInfo;
exports.getSSOTokenFilepath = getSSOTokenFilepath;
exports.getSSOTokenFromFile = getSSOTokenFromFile;
exports.loadConfig = loadConfig;
exports.loadSharedConfigFiles = loadSharedConfigFiles;
exports.loadSsoSessionData = loadSsoSessionData;
exports.memoize = memoize;
exports.nodeDualstackConfigSelectors = nodeDualstackConfigSelectors;
exports.nodeFipsConfigSelectors = nodeFipsConfigSelectors;
exports.numberSelector = numberSelector;
exports.parseKnownFiles = parseKnownFiles;
exports.readFile = readFile;
exports.resolveCustomEndpointsConfig = resolveCustomEndpointsConfig;
exports.resolveDefaultsModeConfig = resolveDefaultsModeConfig;
exports.resolveEndpointsConfig = resolveEndpointsConfig;
exports.resolveRegionConfig = resolveRegionConfig;
