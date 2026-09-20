import { DefaultRetryBackoffStrategy } from "./DefaultRetryBackoffStrategy";
import { DefaultRetryToken } from "./DefaultRetryToken";
import { DEFAULT_MAX_ATTEMPTS, RETRY_MODES } from "./config";
import { INITIAL_RETRY_TOKENS, NO_RETRY_INCREMENT } from "./constants";
import { Retry } from "./retries-2026-config";
const refusal = {
    incompatible: 1,
    attempts: 2,
    capacity: 3,
};
export class StandardRetryStrategy {
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
}
