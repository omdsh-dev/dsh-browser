export type AsyncQueueResult<T> = {
    done: false;
    value: T;
} | {
    done: true;
    value: undefined;
};
/**
 * Single-consumer async queue that bridges background producers to an
 * `AsyncIterator`-style reader. Producers `push()` items; the consumer awaits
 * `next()`. `close()` is idempotent and wakes any pending `next()` with
 * `done: true`. `tryShift()` synchronously drains remaining items after
 * iteration has been signalled to stop.
 */
export declare class AsyncQueue<T> {
    #private;
    /** Enqueue an item, or hand it directly to a waiting reader. Returns `false` once closed. */
    push(item: T): boolean;
    /** Mark the queue done. Idempotent; wakes every pending reader with `done: true`. */
    close(): void;
    /**
     * Resolve with the next item, or `done: true` once the queue is closed and
     * drained. When `signal` is supplied, aborting it resolves a pending read
     * with `done: true` (cancellation is pushed down here rather than handled by
     * an outer `Promise.race`).
     */
    next(signal?: AbortSignal): Promise<AsyncQueueResult<T>>;
    /** Synchronously remove and return the next buffered item, or `undefined` if empty. */
    tryShift(): T | undefined;
}
//# sourceMappingURL=async-queue.d.mts.map