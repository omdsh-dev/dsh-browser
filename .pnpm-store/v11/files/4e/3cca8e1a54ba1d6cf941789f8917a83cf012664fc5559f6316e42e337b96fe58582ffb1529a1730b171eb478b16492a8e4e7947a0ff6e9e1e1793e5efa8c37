import { StandardRetryStrategy } from "./StandardRetryStrategy";
import { Retry } from "./retries-2026-config";
export class ConfiguredRetryStrategy extends StandardRetryStrategy {
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
