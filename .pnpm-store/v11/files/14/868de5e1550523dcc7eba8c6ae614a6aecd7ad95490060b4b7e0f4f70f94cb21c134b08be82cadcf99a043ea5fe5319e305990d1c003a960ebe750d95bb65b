"use strict";
var _AsyncQueue_items, _AsyncQueue_waiters, _AsyncQueue_closed;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncQueue = void 0;
const tslib_1 = require("../tslib.js");
/**
 * Single-consumer async queue that bridges background producers to an
 * `AsyncIterator`-style reader. Producers `push()` items; the consumer awaits
 * `next()`. `close()` is idempotent and wakes any pending `next()` with
 * `done: true`. `tryShift()` synchronously drains remaining items after
 * iteration has been signalled to stop.
 */
class AsyncQueue {
    constructor() {
        _AsyncQueue_items.set(this, []);
        _AsyncQueue_waiters.set(this, []);
        _AsyncQueue_closed.set(this, false);
    }
    /** Enqueue an item, or hand it directly to a waiting reader. Returns `false` once closed. */
    push(item) {
        if (tslib_1.__classPrivateFieldGet(this, _AsyncQueue_closed, "f"))
            return false;
        const w = tslib_1.__classPrivateFieldGet(this, _AsyncQueue_waiters, "f").shift();
        if (w)
            w({ done: false, value: item });
        else
            tslib_1.__classPrivateFieldGet(this, _AsyncQueue_items, "f").push(item);
        return true;
    }
    /** Mark the queue done. Idempotent; wakes every pending reader with `done: true`. */
    close() {
        if (tslib_1.__classPrivateFieldGet(this, _AsyncQueue_closed, "f"))
            return;
        tslib_1.__classPrivateFieldSet(this, _AsyncQueue_closed, true, "f");
        while (tslib_1.__classPrivateFieldGet(this, _AsyncQueue_waiters, "f").length > 0) {
            const w = tslib_1.__classPrivateFieldGet(this, _AsyncQueue_waiters, "f").shift();
            w({ done: true, value: undefined });
        }
    }
    /**
     * Resolve with the next item, or `done: true` once the queue is closed and
     * drained. When `signal` is supplied, aborting it resolves a pending read
     * with `done: true` (cancellation is pushed down here rather than handled by
     * an outer `Promise.race`).
     */
    next(signal) {
        if (tslib_1.__classPrivateFieldGet(this, _AsyncQueue_items, "f").length > 0) {
            return Promise.resolve({ done: false, value: tslib_1.__classPrivateFieldGet(this, _AsyncQueue_items, "f").shift() });
        }
        if (tslib_1.__classPrivateFieldGet(this, _AsyncQueue_closed, "f") || signal?.aborted) {
            return Promise.resolve({ done: true, value: undefined });
        }
        return new Promise((resolve) => {
            const waiter = (r) => {
                signal?.removeEventListener('abort', onAbort);
                resolve(r);
            };
            const onAbort = () => {
                const idx = tslib_1.__classPrivateFieldGet(this, _AsyncQueue_waiters, "f").indexOf(waiter);
                if (idx >= 0)
                    tslib_1.__classPrivateFieldGet(this, _AsyncQueue_waiters, "f").splice(idx, 1);
                resolve({ done: true, value: undefined });
            };
            tslib_1.__classPrivateFieldGet(this, _AsyncQueue_waiters, "f").push(waiter);
            signal?.addEventListener('abort', onAbort, { once: true });
        });
    }
    /** Synchronously remove and return the next buffered item, or `undefined` if empty. */
    tryShift() {
        return tslib_1.__classPrivateFieldGet(this, _AsyncQueue_items, "f").shift();
    }
}
exports.AsyncQueue = AsyncQueue;
_AsyncQueue_items = new WeakMap(), _AsyncQueue_waiters = new WeakMap(), _AsyncQueue_closed = new WeakMap();
//# sourceMappingURL=async-queue.js.map