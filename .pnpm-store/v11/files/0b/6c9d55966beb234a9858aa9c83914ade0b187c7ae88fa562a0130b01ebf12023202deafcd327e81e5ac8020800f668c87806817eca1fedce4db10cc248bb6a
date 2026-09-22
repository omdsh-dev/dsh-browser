import type { BetaManagedAgentsAgentMessageEvent, BetaManagedAgentsStreamSessionEvents } from "../../resources/beta/sessions/events.js";
export type AccumulatedEvent = BetaManagedAgentsAgentMessageEvent;
/**
 * Fold one preview event into an `agent.message` snapshot. Returns a fresh
 * snapshot — the `msg` argument is never mutated.
 *
 * - `event_start` opens the preview: a new snapshot with empty content is
 *   returned (so `msg` may be `undefined`). Returns `undefined` when the
 *   previewed event is not an `agent.message` — this helper only tracks
 *   `agent.message` previews.
 * - `event_delta` is folded into `msg`: a new `delta.index` inserts the
 *   fragment as a fresh content entry; an existing index returns a copy with
 *   that entry appended to. An unrecognised fragment type on an existing
 *   index passes the entry through unchanged — deltas are best-effort and the
 *   buffered final event is canonical.
 * - `agent.message` is the buffered final event: a copy of it is returned,
 *   replacing whatever the preview had accumulated.
 * - Every other event type returns `accumulated` unchanged, so new event types
 *   added to the stream union need no change here.
 */
export declare function accumulateManagedAgentsEvent<T extends AccumulatedEvent>(accumulated: AccumulatedEvent | undefined, event: T): T;
export declare function accumulateManagedAgentsEvent(accumulated: AccumulatedEvent | undefined, event: BetaManagedAgentsStreamSessionEvents): AccumulatedEvent | undefined;
//# sourceMappingURL=accumulate.d.ts.map