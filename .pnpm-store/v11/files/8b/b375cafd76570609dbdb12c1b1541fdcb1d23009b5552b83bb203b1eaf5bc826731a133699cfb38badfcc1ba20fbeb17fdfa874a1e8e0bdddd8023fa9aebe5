import { WaiterConfiguration } from "@smithy/types";
export { WaiterConfiguration };
/**
 * @internal
 */
export declare const waiterServiceDefaults: {
    minDelay: number;
    maxDelay: number;
};
/**
 * @internal
 */
export type WaiterOptions<Client> = WaiterConfiguration<Client> & Required<Pick<WaiterConfiguration<Client>, "minDelay" | "maxDelay">>;
/**
 * @public
 */
export declare enum WaiterState {
    ABORTED = "ABORTED",
    FAILURE = "FAILURE",
    SUCCESS = "SUCCESS",
    RETRY = "RETRY",
    TIMEOUT = "TIMEOUT"
}
/**
 * @public
 */
export type WaiterResult<R = any> = {
    state: WaiterState;
    /**
     * @deprecated because this was untyped as `any`, new code should use the field 'final',
     * which is the same value, but typed.
     */
    reason?: any;
    /**
     * (optional) Indicates a reason for why a waiter has reached its state.
     */
    final?: R;
    /**
     * Responses observed by the waiter during its polling, where the value
     * is the count.
     */
    observedResponses?: Record<string, number>;
};
/**
 * Handles and throws exceptions resulting from the waiterResult
 * @internal
 * @param result - WaiterResult
 */
export declare const checkExceptions: <R>(result: WaiterResult<R>) => WaiterResult<R>;
