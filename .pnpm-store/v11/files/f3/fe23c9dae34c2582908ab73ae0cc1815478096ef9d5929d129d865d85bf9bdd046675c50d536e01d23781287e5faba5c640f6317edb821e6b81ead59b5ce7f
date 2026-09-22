import { getCircularReplacer } from "./circularReplacer";
import { sleep } from "./utils/sleep";
import { WaiterState } from "./waiter";
export const runPolling = async ({ minDelay, maxDelay, maxWaitTime, abortController, client, abortSignal }, input, acceptorChecks) => {
    const observedResponses = {};
    const [minDelayMs, maxDelayMs] = [minDelay * 1000, maxDelay * 1000];
    let currentAttempt = 0;
    const waitUntil = Date.now() + maxWaitTime * 1000;
    const warn403Time = Date.now() + 60_000;
    let didWarn403 = false;
    while (true) {
        if (currentAttempt > 0) {
            const delayMs = exponentialBackoffWithJitter(minDelayMs, maxDelayMs, currentAttempt, waitUntil);
            if (abortController?.signal?.aborted || abortSignal?.aborted) {
                const message = "AbortController signal aborted.";
                observedResponses[message] |= 0;
                observedResponses[message] += 1;
                return { state: WaiterState.ABORTED, observedResponses };
            }
            if (Date.now() + delayMs > waitUntil) {
                return { state: WaiterState.TIMEOUT, observedResponses };
            }
            await sleep(delayMs / 1_000);
        }
        const { state, reason } = await acceptorChecks(client, input);
        if (reason) {
            const message = createMessageFromResponse(reason);
            observedResponses[message] |= 0;
            observedResponses[message] += 1;
        }
        if (state !== WaiterState.RETRY) {
            return { state, reason, final: reason, observedResponses };
        }
        currentAttempt += 1;
        if (!didWarn403 && Date.now() >= warn403Time) {
            checkWarn403(observedResponses, client);
            didWarn403 = true;
        }
    }
};
const checkWarn403 = (observedResponses = {}, client) => {
    const orderedErrors = Object.keys(observedResponses);
    let maxCount = 0;
    let count403 = 0;
    for (const response of orderedErrors) {
        const n = observedResponses[response] | 0;
        maxCount = Math.max(n, maxCount);
        if (response.startsWith("403:")) {
            count403 += n;
        }
    }
    const clientLogger = client?.config?.logger;
    const warningLogger = typeof clientLogger?.warn === "function" && !clientLogger.constructor?.name?.includes?.("NoOpLogger")
        ? clientLogger
        : console;
    if (count403 >= 3 || orderedErrors[orderedErrors.length - 1]?.startsWith("403:")) {
        warningLogger.warn(`@smithy/util-waiter WARN - 403 status code encountered during waiter polling.`);
    }
};
const createMessageFromResponse = (reason) => {
    const status = reason?.$response?.statusCode ?? reason?.$metadata?.httpStatusCode;
    if (reason?.$responseBodyText) {
        return `${status ? status + ": " : ""}Deserialization error for body: ${reason.$responseBodyText}`;
    }
    if (status) {
        if (reason?.$response || reason?.message) {
            return `${status ?? "Unknown"}: ${reason?.message}`;
        }
        return `${status}: OK`;
    }
    return String(reason?.message ?? JSON.stringify(reason, getCircularReplacer()) ?? "Unknown");
};
const exponentialBackoffWithJitter = (minDelayMs, maxDelayMs, attempt, waitUntil) => {
    const attemptCountCeiling = Math.log(maxDelayMs / minDelayMs) / Math.log(2) + 1;
    if (attempt > attemptCountCeiling) {
        return maxDelayMs;
    }
    const delay = minDelayMs * 2 ** (attempt - 1);
    const capped = Math.min(delay, maxDelayMs);
    const waitFor = randomInRange(minDelayMs, capped);
    if (Date.now() + waitFor > waitUntil) {
        const timeRemaining = waitUntil - Date.now();
        return Math.max(0, timeRemaining - 500);
    }
    return waitFor;
};
const randomInRange = (min, max) => min + Math.random() * (max - min);
