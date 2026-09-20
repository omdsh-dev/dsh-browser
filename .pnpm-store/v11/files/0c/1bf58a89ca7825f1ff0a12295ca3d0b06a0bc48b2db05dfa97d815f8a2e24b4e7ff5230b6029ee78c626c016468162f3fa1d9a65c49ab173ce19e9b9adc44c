import { NoOpLogger } from "@smithy/core/client";
import { HttpRequest } from "@smithy/core/protocols";
import { v4 } from "@smithy/core/serde";
import { isServerError, isThrottlingError, isTransientError, } from "../service-error-classification/service-error-classification";
import { INVOCATION_ID_HEADER, REQUEST_HEADER } from "../util-retry/constants";
import { parseRetryAfterHeader } from "./parseRetryAfterHeader";
import { asSdkError } from "./util";
export function bindRetryMiddleware(isStreamingPayload) {
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
export const retryMiddlewareOptions = {
    name: "retryMiddleware",
    tags: ["RETRY"],
    step: "finalizeRequest",
    priority: "high",
    override: true,
};
export function bindGetRetryPlugin(isStreamingPayload) {
    const retryMiddleware = bindRetryMiddleware(isStreamingPayload);
    return (options) => ({
        applyToStack: (clientStack) => {
            clientStack.add(retryMiddleware(options), retryMiddlewareOptions);
        },
    });
}
