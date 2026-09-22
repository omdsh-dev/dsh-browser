import { DefaultRateLimiter } from "./DefaultRateLimiter";
import { StandardRetryStrategy } from "./StandardRetryStrategy";
import { RETRY_MODES } from "./config";
export class AdaptiveRetryStrategy {
    mode = RETRY_MODES.ADAPTIVE;
    rateLimiter;
    standardRetryStrategy;
    constructor(maxAttemptsProvider, options) {
        const { rateLimiter } = options ?? {};
        this.rateLimiter = rateLimiter ?? new DefaultRateLimiter();
        this.standardRetryStrategy = options
            ? new StandardRetryStrategy({
                maxAttempts: typeof maxAttemptsProvider === "number" ? maxAttemptsProvider : 3,
                ...options,
            })
            : new StandardRetryStrategy(maxAttemptsProvider);
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
}
