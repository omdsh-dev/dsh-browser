import { type WaiterOptions, type WaiterResult } from "./waiter";
/**
 * Create a waiter promise that only resolves when:
 * 1. Abort controller is signaled
 * 2. Max wait time is reached
 * 3. `acceptorChecks` succeeds, or fails
 * Otherwise, it invokes `acceptorChecks` with exponential-backoff delay.
 *
 * @internal
 */
export declare const createWaiter: <Client, Input, Reason = any>(options: WaiterOptions<Client>, input: Input, acceptorChecks: (client: Client, input: Input) => Promise<WaiterResult<Reason>>) => Promise<WaiterResult<Reason>>;
