import type { Provider, RetryErrorInfo, RetryStrategyV2, StandardRetryBackoffStrategy, StandardRetryToken } from "@smithy/types";
/**
 * @public
 */
export type StandardRetryStrategyOptions = {
    /**
     * Maximum number of attempts. If set to 1, no retries will be made.
     */
    maxAttempts: number;
    /**
     * When present, overrides the base delay for non-throttling retries.
     */
    baseDelay?: number;
    /**
     * Backoff calculator.
     */
    backoff?: StandardRetryBackoffStrategy;
};
/**
 * @public
 */
export declare class StandardRetryStrategy implements RetryStrategyV2 {
    readonly mode: string;
    protected readonly retryBackoffStrategy: StandardRetryBackoffStrategy;
    private capacity;
    private readonly maxAttemptsProvider;
    private readonly baseDelay;
    constructor(maxAttempts: number);
    constructor(maxAttemptsProvider: Provider<number>);
    constructor(options: StandardRetryStrategyOptions);
    acquireInitialRetryToken(retryTokenScope: string): Promise<StandardRetryToken>;
    refreshRetryTokenForRetry(token: StandardRetryToken, errorInfo: RetryErrorInfo): Promise<StandardRetryToken>;
    recordSuccess(token: StandardRetryToken): void;
    /**
     * This number decreases when retries are executed and refills when requests or retries succeed.
     * @returns the current available retry capacity.
     */
    getCapacity(): number;
    /**
     * There is an existing integration which accesses this field.
     * @deprecated
     */
    maxAttempts(): Promise<number>;
    private getMaxAttempts;
    /**
     * 0 - OK to retry.
     * 1 - error is not classified as retryable.
     * 2 - attempt count exhausted.
     * 3 - no capacity left (retry tokens exhausted).
     *
     * @returns 0 or the number of the highest priority (lowest integer) reason why retry is not possible.
     */
    private retryCode;
    private getCapacityCost;
    private isRetryableError;
}
