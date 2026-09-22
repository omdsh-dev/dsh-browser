const { NoOpLogger, normalizeProvider } = require("@smithy/core/client");
const { HttpResponse, HttpRequest } = require("@smithy/core/protocols");
const { parseRfc7231DateTime, v4 } = require("@smithy/core/serde");

const isStreamingPayload = (request) => request?.body instanceof ReadableStream;

const CLOCK_SKEW_ERROR_CODES = [
    "AccessDeniedException",
    "AuthFailure",
    "InvalidSignatureException",
    "RequestExpired",
    "RequestInTheFuture",
    "RequestTimeTooSkewed",
    "SignatureDoesNotMatch",
];
const THROTTLING_ERROR_CODES = [
    "BandwidthLimitExceeded",
    "EC2ThrottledException",
    "LimitExceededException",
    "PriorRequestNotComplete",
    "ProvisionedThroughputExceededException",
    "RequestLimitExceeded",
    "RequestThrottled",
    "RequestThrottledException",
    "SlowDown",
    "ThrottledException",
    "Throttling",
    "ThrottlingException",
    "TooManyRequestsException",
    "TransactionInProgressException",
];
const TRANSIENT_ERROR_CODES = ["TimeoutError", "RequestTimeout", "RequestTimeoutException"];
const TRANSIENT_ERROR_STATUS_CODES = [500, 502, 503, 504];
const NODEJS_TIMEOUT_ERROR_CODES = ["ECONNRESET", "ECONNREFUSED", "EPIPE", "ETIMEDOUT"];
const NODEJS_NETWORK_ERROR_CODES = ["EHOSTUNREACH", "ENETUNREACH", "ENOTFOUND", "EAI_AGAIN"];

const isRetryableByTrait = (error) => error?.$retryable !== undefined;
const isClockSkewError = (error) => CLOCK_SKEW_ERROR_CODES.includes(error.name);
const isClockSkewCorrectedError = (error) => error.$metadata?.clockSkewCorrected;
const isBrowserNetworkError = (error) => {
    const errorMessages = new Set([
        "Failed to fetch",
        "NetworkError when attempting to fetch resource",
        "The Internet connection appears to be offline",
        "Load failed",
        "Network request failed",
    ]);
    const isValid = error && error instanceof TypeError;
    if (!isValid) {
        return false;
    }
    return errorMessages.has(error.message);
};
const isThrottlingError = (error) => error.$metadata?.httpStatusCode === 429 ||
    THROTTLING_ERROR_CODES.includes(error.name) ||
    error.$retryable?.throttling == true;
const isTransientError = (error, depth = 0) => isRetryableByTrait(error) ||
    isClockSkewCorrectedError(error) ||
    (error.name === "InvalidSignatureException" && error.message?.includes("Signature expired")) ||
    TRANSIENT_ERROR_CODES.includes(error.name) ||
    NODEJS_TIMEOUT_ERROR_CODES.includes(error?.code || "") ||
    NODEJS_NETWORK_ERROR_CODES.includes(error?.code || "") ||
    TRANSIENT_ERROR_STATUS_CODES.includes(error.$metadata?.httpStatusCode || 0) ||
    isBrowserNetworkError(error) ||
    isNodeJsHttp2TransientError(error) ||
    (error.cause !== undefined && depth <= 10 && isTransientError(error.cause, depth + 1));
const isServerError = (error) => {
    if (error.$metadata?.httpStatusCode !== undefined) {
        const statusCode = error.$metadata.httpStatusCode;
        if (500 <= statusCode && statusCode <= 599 && !isTransientError(error)) {
            return true;
        }
        return false;
    }
    return false;
};
function isNodeJsHttp2TransientError(error) {
    return error.code === "ERR_HTTP2_STREAM_ERROR" && error.message.includes("NGHTTP2_REFUSED_STREAM");
}

const DEFAULT_RETRY_DELAY_BASE = 100;
const MAXIMUM_RETRY_DELAY = 20 * 1000;
const THROTTLING_RETRY_DELAY_BASE = 500;
const INITIAL_RETRY_TOKENS = 500;
const RETRY_COST = 5;
const TIMEOUT_RETRY_COST = 10;
const NO_RETRY_INCREMENT = 1;
const INVOCATION_ID_HEADER = "amz-sdk-invocation-id";
const REQUEST_HEADER = "amz-sdk-request";

function parseRetryAfterHeader(response, logger) {
    if (!HttpResponse.isInstance(response)) {
        return;
    }
    for (const header of Object.keys(response.headers)) {
        const h = header.toLowerCase();
        if (h === "retry-after") {
            const retryAfter = response.headers[header];
            let retryAfterSeconds = NaN;
            if (retryAfter.endsWith("GMT")) {
                try {
                    const date = parseRfc7231DateTime(retryAfter);
                    retryAfterSeconds = (date.getTime() - Date.now()) / 1000;
                }
                catch (e) {
                    logger?.trace?.("Failed to parse retry-after header");
                    logger?.trace?.(e);
                }
            }
            else if (retryAfter.match(/ GMT, ((\d+)|(\d+\.\d+))$/)) {
                retryAfterSeconds = Number(retryAfter.match(/ GMT, ([\d.]+)$/)?.[1]);
            }
            else if (retryAfter.match(/^((\d+)|(\d+\.\d+))$/)) {
                retryAfterSeconds = Number(retryAfter);
            }
            else if (Date.parse(retryAfter) >= Date.now()) {
                retryAfterSeconds = (Date.parse(retryAfter) - Date.now()) / 1000;
            }
            if (isNaN(retryAfterSeconds)) {
                return;
            }
            return new Date(Date.now() + retryAfterSeconds * 1000);
        }
        else if (h === "x-amz-retry-after") {
            const v = response.headers[header];
            const backoffMilliseconds = Number(v);
            if (isNaN(backoffMilliseconds)) {
                logger?.trace?.(`Failed to parse x-amz-retry-after=${v}`);
                return;
            }
            return new Date(Date.now() + backoffMilliseconds);
        }
    }
}
function getRetryAfterHint(response, logger) {
    return parseRetryAfterHeader(response, logger);
}

const asSdkError = (error) => {
    if (error instanceof Error)
        return error;
    if (error instanceof Object)
        return Object.assign(new Error(), error);
    if (typeof error === "string")
        return new Error(error);
    return new Error(`AWS SDK error wrapper for ${error}`);
};

function bindRetryMiddleware(isStreamingPayload) {
    return (options) => (next, context) => async (args) => {
        let retryStrategy = await options.retryStrategy();
        const maxAttempts = await options.maxAttempts();
        if (isRetryStrategyV2(retryStrategy)) {
            retryStrategy = retryStrategy;
            let retryToken = await retryStrategy.acquireInitialRetryToken((context["partition_id"] ?? "") + (context.__retryLongPoll ? ":longpoll" : ""));
            let lastError = new Error();
            let attempts = 0;
            let totalRetryDelay = 0;
            const { request } = args;
            const isRequest = HttpRequest.isInstance(request);
            if (isRequest) {
                request.headers[INVOCATION_ID_HEADER] = v4();
            }
            while (true) {
                try {
                    if (isRequest) {
                        request.headers[REQUEST_HEADER] = `attempt=${attempts + 1}; max=${maxAttempts}`;
                    }
                    const { response, output } = await next(args);
                    retryStrategy.recordSuccess(retryToken);
                    output.$metadata.attempts = attempts + 1;
                    output.$metadata.totalRetryDelay = totalRetryDelay;
                    return { response, output };
                }
                catch (e) {
                    const retryErrorInfo = getRetryErrorInfo(e, options.logger);
                    lastError = asSdkError(e);
                    if (isRequest && isStreamingPayload(request)) {
                        (context.logger instanceof NoOpLogger ? console : context.logger)?.warn("An error was encountered in a non-retryable streaming request.");
                        throw lastError;
                    }
                    try {
                        retryToken = await retryStrategy.refreshRetryTokenForRetry(retryToken, retryErrorInfo);
                    }
                    catch (ignoredRefreshError) {
                        if (!lastError.$metadata) {
                            lastError.$metadata = {};
                        }
                        lastError.$metadata.attempts = attempts + 1;
                        lastError.$metadata.totalRetryDelay = totalRetryDelay;
                        throw lastError;
                    }
                    attempts = retryToken.getRetryCount();
                    const delay = retryToken.getRetryDelay();
                    totalRetryDelay += (retryToken?.$retryLog?.acquisitionDelay ?? 0) + delay;
                    if (delay > 0) {
                        await cooldown(delay);
                    }
                }
            }
        }
        else {
            retryStrategy = retryStrategy;
            if (retryStrategy?.mode) {
                context.userAgent = [...(context.userAgent || []), ["cfg/retry-mode", retryStrategy.mode]];
            }
            return retryStrategy.retry(next, args);
        }
    };
}
const cooldown = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isRetryStrategyV2 = (retryStrategy) => typeof retryStrategy.acquireInitialRetryToken !== "undefined" &&
    typeof retryStrategy.refreshRetryTokenForRetry !== "undefined" &&
    typeof retryStrategy.recordSuccess !== "undefined";
const getRetryErrorInfo = (error, logger) => {
    const errorInfo = {
        error,
        errorType: getRetryErrorType(error),
    };
    const retryAfterHint = parseRetryAfterHeader(error.$response, logger);
    if (retryAfterHint) {
        errorInfo.retryAfterHint = retryAfterHint;
    }
    return errorInfo;
};
const getRetryErrorType = (error) => {
    if (isThrottlingError(error))
        return "THROTTLING";
    if (isTransientError(error))
        return "TRANSIENT";
    if (isServerError(error))
        return "SERVER_ERROR";
    return "CLIENT_ERROR";
};
const retryMiddlewareOptions = {
    name: "retryMiddleware",
    tags: ["RETRY"],
    step: "finalizeRequest",
    priority: "high",
    override: true,
};
function bindGetRetryPlugin(isStreamingPayload) {
    const retryMiddleware = bindRetryMiddleware(isStreamingPayload);
    return (options) => ({
        applyToStack: (clientStack) => {
            clientStack.add(retryMiddleware(options), retryMiddlewareOptions);
        },
    });
}

class DefaultRateLimiter {
    static setTimeoutFn = (fn, delay) => setTimeout(fn, delay);
    beta;
    minCapacity;
    minFillRate;
    scaleConstant;
    smooth;
    enabled = false;
    availableTokens = 0;
    lastMaxRate = 0;
    measuredTxRate = 0;
    requestCount = 0;
    fillRate;
    lastThrottleTime;
    lastTimestamp = 0;
    lastTxRateBucket;
    maxCapacity;
    timeWindow = 0;
    constructor(options) {
        this.beta = options?.beta ?? 0.7;
        this.minCapacity = options?.minCapacity ?? 1;
        this.minFillRate = options?.minFillRate ?? 0.5;
        this.scaleConstant = options?.scaleConstant ?? 0.4;
        this.smooth = options?.smooth ?? 0.8;
        this.lastThrottleTime = this.getCurrentTimeInSeconds();
        this.lastTxRateBucket = Math.floor(this.getCurrentTimeInSeconds());
        this.fillRate = this.minFillRate;
        this.maxCapacity = this.minCapacity;
    }
    async getSendToken() {
        return this.acquireTokenBucket(1);
    }
    updateClientSendingRate(response) {
        let calculatedRate;
        this.updateMeasuredRate();
        const retryErrorInfo = response;
        const isThrottling = retryErrorInfo?.errorType === "THROTTLING" || isThrottlingError(retryErrorInfo?.error ?? response);
        if (isThrottling) {
            const rateToUse = !this.enabled ? this.measuredTxRate : Math.min(this.measuredTxRate, this.fillRate);
            this.lastMaxRate = rateToUse;
            this.calculateTimeWindow();
            this.lastThrottleTime = this.getCurrentTimeInSeconds();
            calculatedRate = this.cubicThrottle(rateToUse);
            this.enableTokenBucket();
        }
        else {
            this.calculateTimeWindow();
            calculatedRate = this.cubicSuccess(this.getCurrentTimeInSeconds());
        }
        const newRate = Math.min(calculatedRate, 2 * this.measuredTxRate);
        this.updateTokenBucketRate(newRate);
    }
    getCurrentTimeInSeconds() {
        return Date.now() / 1000;
    }
    async acquireTokenBucket(amount) {
        if (!this.enabled) {
            return;
        }
        this.refillTokenBucket();
        while (amount > this.availableTokens) {
            const delay = ((amount - this.availableTokens) / this.fillRate) * 1000;
            await new Promise((resolve) => DefaultRateLimiter.setTimeoutFn(resolve, delay));
            this.refillTokenBucket();
        }
        this.availableTokens = this.availableTokens - amount;
    }
    refillTokenBucket() {
        const timestamp = this.getCurrentTimeInSeconds();
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
            return;
        }
        const fillAmount = (timestamp - this.lastTimestamp) * this.fillRate;
        this.availableTokens = Math.min(this.maxCapacity, this.availableTokens + fillAmount);
        this.lastTimestamp = timestamp;
    }
    calculateTimeWindow() {
        this.timeWindow = this.getPrecise(Math.pow((this.lastMaxRate * (1 - this.beta)) / this.scaleConstant, 1 / 3));
    }
    cubicThrottle(rateToUse) {
        return this.getPrecise(rateToUse * this.beta);
    }
    cubicSuccess(timestamp) {
        return this.getPrecise(this.scaleConstant * Math.pow(timestamp - this.lastThrottleTime - this.timeWindow, 3) + this.lastMaxRate);
    }
    enableTokenBucket() {
        this.enabled = true;
    }
    updateTokenBucketRate(newRate) {
        this.refillTokenBucket();
        this.fillRate = Math.max(newRate, this.minFillRate);
        this.maxCapacity = Math.max(newRate, this.minCapacity);
        this.availableTokens = Math.min(this.availableTokens, this.maxCapacity);
    }
    updateMeasuredRate() {
        const t = this.getCurrentTimeInSeconds();
        const timeBucket = Math.floor(t * 2) / 2;
        this.requestCount++;
        if (timeBucket > this.lastTxRateBucket) {
            const currentRate = this.requestCount / (timeBucket - this.lastTxRateBucket);
            this.measuredTxRate = this.getPrecise(currentRate * this.smooth + this.measuredTxRate * (1 - this.smooth));
            this.requestCount = 0;
            this.lastTxRateBucket = timeBucket;
        }
    }
    getPrecise(num) {
        return parseFloat(num.toFixed(8));
    }
}

class Retry {
    static v2026 = typeof process !== "undefined" && process.env?.SMITHY_NEW_RETRIES_2026 === "true";
    static delay() {
        return Retry.v2026 ? 50 : 100;
    }
    static throttlingDelay() {
        return Retry.v2026 ? 1_000 : 500;
    }
    static cost() {
        return Retry.v2026 ? 14 : 5;
    }
    static throttlingCost() {
        return Retry.v2026 ? 5 : 10;
    }
    static modifiedCostType() {
        return Retry.v2026 ? "THROTTLING" : "TRANSIENT";
    }
}

class DefaultRetryBackoffStrategy {
    x = Retry.delay();
    computeNextBackoffDelay(i) {
        const b = Math.random();
        const r = 2;
        const t_i = b * Math.min(this.x * r ** i, MAXIMUM_RETRY_DELAY);
        return Math.floor(t_i);
    }
    setDelayBase(delay) {
        this.x = delay;
    }
}

class DefaultRetryToken {
    delay;
    count;
    cost;
    longPoll;
    $retryLog = {
        acquisitionDelay: 0,
    };
    constructor(delay, count, cost, longPoll) {
        this.delay = delay;
        this.count = count;
        this.cost = cost;
        this.longPoll = longPoll;
    }
    getRetryCount() {
        return this.count;
    }
    getRetryDelay() {
        return Math.min(MAXIMUM_RETRY_DELAY, this.delay);
    }
    getRetryCost() {
        return this.cost;
    }
    isLongPoll() {
        return this.longPoll;
    }
}

var RETRY_MODES;
(function (RETRY_MODES) {
    RETRY_MODES["STANDARD"] = "standard";
    RETRY_MODES["ADAPTIVE"] = "adaptive";
})(RETRY_MODES || (RETRY_MODES = {}));
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_MODE = RETRY_MODES.STANDARD;

const refusal = {
    incompatible: 1,
    attempts: 2,
    capacity: 3,
};
let StandardRetryStrategy$1 = class StandardRetryStrategy {
    mode = RETRY_MODES.STANDARD;
    retryBackoffStrategy;
    capacity = INITIAL_RETRY_TOKENS;
    maxAttemptsProvider;
    baseDelay;
    constructor(arg1) {
        if (typeof arg1 === "number") {
            this.maxAttemptsProvider = async () => arg1;
        }
        else if (typeof arg1 === "function") {
            this.maxAttemptsProvider = arg1;
        }
        else if (arg1 && typeof arg1 === "object") {
            this.maxAttemptsProvider = async () => arg1.maxAttempts;
            this.baseDelay = arg1.baseDelay;
            this.retryBackoffStrategy = arg1.backoff;
        }
        this.maxAttemptsProvider ??= async () => DEFAULT_MAX_ATTEMPTS;
        this.baseDelay ??= Retry.delay();
        this.retryBackoffStrategy ??= new DefaultRetryBackoffStrategy();
    }
    async acquireInitialRetryToken(retryTokenScope) {
        return new DefaultRetryToken(Retry.delay(), 0, undefined, Retry.v2026 && retryTokenScope.includes(":longpoll"));
    }
    async refreshRetryTokenForRetry(token, errorInfo) {
        const maxAttempts = await this.getMaxAttempts();
        const retryCode = this.retryCode(token, errorInfo, maxAttempts);
        const shouldRetry = retryCode === 0;
        const isLongPoll = token.isLongPoll?.();
        if (shouldRetry || isLongPoll) {
            const errorType = errorInfo.errorType;
            this.retryBackoffStrategy.setDelayBase(errorType === "THROTTLING" ? Retry.throttlingDelay() : this.baseDelay);
            const delayFromErrorType = this.retryBackoffStrategy.computeNextBackoffDelay(token.getRetryCount());
            let retryDelay = delayFromErrorType;
            if (errorInfo.retryAfterHint instanceof Date) {
                retryDelay = Math.max(delayFromErrorType, Math.min(errorInfo.retryAfterHint.getTime() - Date.now(), delayFromErrorType + 5_000));
            }
            if (!shouldRetry) {
                const longPollBackoff = Retry.v2026 && retryCode === refusal.capacity && isLongPoll ? retryDelay : 0;
                if (longPollBackoff > 0) {
                    await new Promise((r) => setTimeout(r, longPollBackoff));
                }
            }
            else {
                const capacityCost = this.getCapacityCost(errorType);
                this.capacity -= capacityCost;
                const nextToken = new DefaultRetryToken(0, token.getRetryCount() + 1, capacityCost, token.isLongPoll?.() ?? false);
                await new Promise((r) => setTimeout(r, retryDelay));
                nextToken.$retryLog.acquisitionDelay = retryDelay;
                return nextToken;
            }
        }
        throw new Error("No retry token available");
    }
    recordSuccess(token) {
        this.capacity = Math.min(INITIAL_RETRY_TOKENS, this.capacity + (token.getRetryCost() ?? NO_RETRY_INCREMENT));
    }
    getCapacity() {
        return this.capacity;
    }
    async maxAttempts() {
        return this.maxAttemptsProvider();
    }
    async getMaxAttempts() {
        try {
            return await this.maxAttemptsProvider();
        }
        catch (ignored) {
            console.warn(`Max attempts provider could not resolve. Using default of ${DEFAULT_MAX_ATTEMPTS}`);
            return DEFAULT_MAX_ATTEMPTS;
        }
    }
    retryCode(tokenToRenew, errorInfo, maxAttempts) {
        const attempts = tokenToRenew.getRetryCount() + 1;
        const retryableStatus = this.isRetryableError(errorInfo.errorType) ? 0 : refusal.incompatible;
        const attemptStatus = attempts < maxAttempts ? 0 : refusal.attempts;
        const capacityStatus = this.capacity >= this.getCapacityCost(errorInfo.errorType) ? 0 : refusal.capacity;
        return retryableStatus || attemptStatus || capacityStatus;
    }
    getCapacityCost(errorType) {
        return errorType === Retry.modifiedCostType() ? Retry.throttlingCost() : Retry.cost();
    }
    isRetryableError(errorType) {
        return errorType === "THROTTLING" || errorType === "TRANSIENT";
    }
};

let AdaptiveRetryStrategy$1 = class AdaptiveRetryStrategy {
    mode = RETRY_MODES.ADAPTIVE;
    rateLimiter;
    standardRetryStrategy;
    constructor(maxAttemptsProvider, options) {
        const { rateLimiter } = options ?? {};
        this.rateLimiter = rateLimiter ?? new DefaultRateLimiter();
        this.standardRetryStrategy = options
            ? new StandardRetryStrategy$1({
                maxAttempts: typeof maxAttemptsProvider === "number" ? maxAttemptsProvider : 3,
                ...options,
            })
            : new StandardRetryStrategy$1(maxAttemptsProvider);
    }
    async acquireInitialRetryToken(retryTokenScope) {
        const token = await this.standardRetryStrategy.acquireInitialRetryToken(retryTokenScope);
        await this.rateLimiter.getSendToken();
        return token;
    }
    async refreshRetryTokenForRetry(tokenToRenew, errorInfo) {
        this.rateLimiter.updateClientSendingRate(errorInfo);
        const token = await this.standardRetryStrategy.refreshRetryTokenForRetry(tokenToRenew, errorInfo);
        await this.rateLimiter.getSendToken();
        return token;
    }
    recordSuccess(token) {
        this.rateLimiter.updateClientSendingRate({});
        this.standardRetryStrategy.recordSuccess(token);
    }
    async maxAttemptsProvider() {
        return this.standardRetryStrategy.maxAttempts();
    }
};

class ConfiguredRetryStrategy extends StandardRetryStrategy$1 {
    computeNextBackoffDelay;
    constructor(maxAttempts, computeNextBackoffDelay = Retry.delay()) {
        super(typeof maxAttempts === "function" ? maxAttempts : async () => maxAttempts);
        if (typeof computeNextBackoffDelay === "number") {
            this.computeNextBackoffDelay = () => computeNextBackoffDelay;
        }
        else {
            this.computeNextBackoffDelay = computeNextBackoffDelay;
        }
        this.retryBackoffStrategy.computeNextBackoffDelay = (completedAttempt) => {
            const nextAttempt = completedAttempt + 1;
            return this.computeNextBackoffDelay(nextAttempt);
        };
    }
}

const getDefaultRetryQuota = (initialRetryTokens, options) => {
    const MAX_CAPACITY = initialRetryTokens;
    const noRetryIncrement = NO_RETRY_INCREMENT;
    const retryCost = RETRY_COST;
    const timeoutRetryCost = TIMEOUT_RETRY_COST;
    let availableCapacity = initialRetryTokens;
    const getCapacityAmount = (error) => (error.name === "TimeoutError" ? timeoutRetryCost : retryCost);
    const hasRetryTokens = (error) => getCapacityAmount(error) <= availableCapacity;
    const retrieveRetryTokens = (error) => {
        if (!hasRetryTokens(error)) {
            throw new Error("No retry token available");
        }
        const capacityAmount = getCapacityAmount(error);
        availableCapacity -= capacityAmount;
        return capacityAmount;
    };
    const releaseRetryTokens = (capacityReleaseAmount) => {
        availableCapacity += capacityReleaseAmount ?? noRetryIncrement;
        availableCapacity = Math.min(availableCapacity, MAX_CAPACITY);
    };
    return Object.freeze({
        hasRetryTokens,
        retrieveRetryTokens,
        releaseRetryTokens,
    });
};

const defaultDelayDecider = (delayBase, attempts) => Math.floor(Math.min(MAXIMUM_RETRY_DELAY, Math.random() * 2 ** attempts * delayBase));

const defaultRetryDecider = (error) => {
    if (!error) {
        return false;
    }
    return isRetryableByTrait(error) || isClockSkewError(error) || isThrottlingError(error) || isTransientError(error);
};

class StandardRetryStrategy {
    maxAttemptsProvider;
    retryDecider;
    delayDecider;
    retryQuota;
    mode = RETRY_MODES.STANDARD;
    constructor(maxAttemptsProvider, options) {
        this.maxAttemptsProvider = maxAttemptsProvider;
        this.retryDecider = options?.retryDecider ?? defaultRetryDecider;
        this.delayDecider = options?.delayDecider ?? defaultDelayDecider;
        this.retryQuota = options?.retryQuota ?? getDefaultRetryQuota(INITIAL_RETRY_TOKENS);
    }
    shouldRetry(error, attempts, maxAttempts) {
        return attempts < maxAttempts && this.retryDecider(error) && this.retryQuota.hasRetryTokens(error);
    }
    async getMaxAttempts() {
        let maxAttempts;
        try {
            maxAttempts = await this.maxAttemptsProvider();
        }
        catch (ignored) {
            maxAttempts = DEFAULT_MAX_ATTEMPTS;
        }
        return maxAttempts;
    }
    async retry(next, args, options) {
        let retryTokenAmount;
        let attempts = 0;
        let totalDelay = 0;
        const maxAttempts = await this.getMaxAttempts();
        const { request } = args;
        if (HttpRequest.isInstance(request)) {
            request.headers[INVOCATION_ID_HEADER] = v4();
        }
        while (true) {
            try {
                if (HttpRequest.isInstance(request)) {
                    request.headers[REQUEST_HEADER] = `attempt=${attempts + 1}; max=${maxAttempts}`;
                }
                if (options?.beforeRequest) {
                    await options.beforeRequest();
                }
                const { response, output } = await next(args);
                if (options?.afterRequest) {
                    options.afterRequest(response);
                }
                this.retryQuota.releaseRetryTokens(retryTokenAmount);
                output.$metadata.attempts = attempts + 1;
                output.$metadata.totalRetryDelay = totalDelay;
                return { response, output };
            }
            catch (e) {
                const err = asSdkError(e);
                attempts++;
                if (this.shouldRetry(err, attempts, maxAttempts)) {
                    retryTokenAmount = this.retryQuota.retrieveRetryTokens(err);
                    const delayFromDecider = this.delayDecider(isThrottlingError(err) ? THROTTLING_RETRY_DELAY_BASE : DEFAULT_RETRY_DELAY_BASE, attempts);
                    const delayFromResponse = getDelayFromRetryAfterHeader(err.$response);
                    const delay = Math.max(delayFromResponse || 0, delayFromDecider);
                    totalDelay += delay;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
                if (!err.$metadata) {
                    err.$metadata = {};
                }
                err.$metadata.attempts = attempts;
                err.$metadata.totalRetryDelay = totalDelay;
                throw err;
            }
        }
    }
}
const getDelayFromRetryAfterHeader = (response) => {
    if (!HttpResponse.isInstance(response))
        return;
    const retryAfterHeaderName = Object.keys(response.headers).find((key) => key.toLowerCase() === "retry-after");
    if (!retryAfterHeaderName)
        return;
    const retryAfter = response.headers[retryAfterHeaderName];
    const retryAfterSeconds = Number(retryAfter);
    if (!Number.isNaN(retryAfterSeconds))
        return Math.min(retryAfterSeconds * 1000, 20_000);
    const retryAfterDate = new Date(retryAfter);
    return Math.min(retryAfterDate.getTime() - Date.now(), 20_000);
};

class AdaptiveRetryStrategy extends StandardRetryStrategy {
    rateLimiter;
    constructor(maxAttemptsProvider, options) {
        const { rateLimiter, ...superOptions } = options ?? {};
        super(maxAttemptsProvider, superOptions);
        this.rateLimiter = rateLimiter ?? new DefaultRateLimiter();
        this.mode = RETRY_MODES.ADAPTIVE;
    }
    async retry(next, args) {
        return super.retry(next, args, {
            beforeRequest: async () => {
                return this.rateLimiter.getSendToken();
            },
            afterRequest: (response) => {
                this.rateLimiter.updateClientSendingRate(response);
            },
        });
    }
}

const resolveRetryConfig = (input, defaults) => {
    const { retryStrategy, retryMode } = input;
    const { defaultMaxAttempts = DEFAULT_MAX_ATTEMPTS, defaultBaseDelay = Retry.delay() } = defaults ?? {};
    const maxAttemptsProvider = normalizeProvider(input.maxAttempts ?? defaultMaxAttempts);
    let controller = retryStrategy
        ? Promise.resolve(retryStrategy)
        : undefined;
    const getDefault = async () => {
        const maxAttempts = await maxAttemptsProvider();
        const adaptive = (await normalizeProvider(retryMode)()) === RETRY_MODES.ADAPTIVE;
        if (adaptive) {
            return new AdaptiveRetryStrategy$1(maxAttemptsProvider, {
                maxAttempts,
                baseDelay: defaultBaseDelay,
            });
        }
        return new StandardRetryStrategy$1({
            maxAttempts,
            baseDelay: defaultBaseDelay,
        });
    };
    return Object.assign(input, {
        maxAttempts: maxAttemptsProvider,
        retryStrategy: () => (controller ??= getDefault()),
    });
};

const omitRetryHeadersMiddleware = () => (next) => async (args) => {
    const { request } = args;
    if (HttpRequest.isInstance(request)) {
        delete request.headers[INVOCATION_ID_HEADER];
        delete request.headers[REQUEST_HEADER];
    }
    return next(args);
};
const omitRetryHeadersMiddlewareOptions = {
    name: "omitRetryHeadersMiddleware",
    tags: ["RETRY", "HEADERS", "OMIT_RETRY_HEADERS"],
    relation: "before",
    toMiddleware: "awsAuthMiddleware",
    override: true,
};
const getOmitRetryHeadersPlugin = (options) => ({
    applyToStack: (clientStack) => {
        clientStack.addRelativeTo(omitRetryHeadersMiddleware(), omitRetryHeadersMiddlewareOptions);
    },
});

const no = Symbol.for("node-only");
const ENV_MAX_ATTEMPTS = no;
const CONFIG_MAX_ATTEMPTS = no;
const NODE_MAX_ATTEMPT_CONFIG_OPTIONS = no;
const ENV_RETRY_MODE = no;
const CONFIG_RETRY_MODE = no;
const NODE_RETRY_MODE_CONFIG_OPTIONS = no;
const retryMiddleware = bindRetryMiddleware(isStreamingPayload);
const getRetryPlugin = bindGetRetryPlugin(isStreamingPayload);

exports.AdaptiveRetryStrategy = AdaptiveRetryStrategy$1;
exports.CONFIG_MAX_ATTEMPTS = CONFIG_MAX_ATTEMPTS;
exports.CONFIG_RETRY_MODE = CONFIG_RETRY_MODE;
exports.ConfiguredRetryStrategy = ConfiguredRetryStrategy;
exports.DEFAULT_MAX_ATTEMPTS = DEFAULT_MAX_ATTEMPTS;
exports.DEFAULT_RETRY_DELAY_BASE = DEFAULT_RETRY_DELAY_BASE;
exports.DEFAULT_RETRY_MODE = DEFAULT_RETRY_MODE;
exports.DefaultRateLimiter = DefaultRateLimiter;
exports.DeprecatedAdaptiveRetryStrategy = AdaptiveRetryStrategy;
exports.DeprecatedStandardRetryStrategy = StandardRetryStrategy;
exports.ENV_MAX_ATTEMPTS = ENV_MAX_ATTEMPTS;
exports.ENV_RETRY_MODE = ENV_RETRY_MODE;
exports.INITIAL_RETRY_TOKENS = INITIAL_RETRY_TOKENS;
exports.INVOCATION_ID_HEADER = INVOCATION_ID_HEADER;
exports.MAXIMUM_RETRY_DELAY = MAXIMUM_RETRY_DELAY;
exports.NODE_MAX_ATTEMPT_CONFIG_OPTIONS = NODE_MAX_ATTEMPT_CONFIG_OPTIONS;
exports.NODE_RETRY_MODE_CONFIG_OPTIONS = NODE_RETRY_MODE_CONFIG_OPTIONS;
exports.NO_RETRY_INCREMENT = NO_RETRY_INCREMENT;
exports.REQUEST_HEADER = REQUEST_HEADER;
exports.RETRY_COST = RETRY_COST;
exports.RETRY_MODES = RETRY_MODES;
exports.Retry = Retry;
exports.StandardRetryStrategy = StandardRetryStrategy$1;
exports.THROTTLING_RETRY_DELAY_BASE = THROTTLING_RETRY_DELAY_BASE;
exports.TIMEOUT_RETRY_COST = TIMEOUT_RETRY_COST;
exports.defaultDelayDecider = defaultDelayDecider;
exports.defaultRetryDecider = defaultRetryDecider;
exports.getOmitRetryHeadersPlugin = getOmitRetryHeadersPlugin;
exports.getRetryAfterHint = getRetryAfterHint;
exports.getRetryPlugin = getRetryPlugin;
exports.isBrowserNetworkError = isBrowserNetworkError;
exports.isClockSkewCorrectedError = isClockSkewCorrectedError;
exports.isClockSkewError = isClockSkewError;
exports.isNodeJsHttp2TransientError = isNodeJsHttp2TransientError;
exports.isRetryableByTrait = isRetryableByTrait;
exports.isServerError = isServerError;
exports.isThrottlingError = isThrottlingError;
exports.isTransientError = isTransientError;
exports.omitRetryHeadersMiddleware = omitRetryHeadersMiddleware;
exports.omitRetryHeadersMiddlewareOptions = omitRetryHeadersMiddlewareOptions;
exports.resolveRetryConfig = resolveRetryConfig;
exports.retryMiddleware = retryMiddleware;
exports.retryMiddlewareOptions = retryMiddlewareOptions;
