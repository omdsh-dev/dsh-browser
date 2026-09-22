import type { SpanAttributes, SpanOptions, SpanStatus, TelemetryContext, TelemetrySpan } from "./index.ts";
export interface RecordedTelemetryEvent {
    readonly name: string;
    readonly attributes: Readonly<SpanAttributes>;
}
export interface RecordedTelemetrySpan {
    readonly id: number;
    readonly parentId: number | null;
    readonly name: string;
    readonly attributes: Readonly<SpanAttributes>;
    readonly events: readonly RecordedTelemetryEvent[];
    readonly status: SpanStatus;
    readonly settled: boolean;
    readonly endSequence?: number;
}
/**
 * Backend-neutral reference implementation that records spans in process memory.
 * Create a fresh instance to isolate tests or independent recording scopes.
 */
export declare class InMemoryTelemetryContext implements TelemetryContext {
    private readonly state;
    startSpan<T>(options: SpanOptions, callback: (span: TelemetrySpan) => T | Promise<T>): Promise<T>;
    /** Returns detached snapshots in span-start order. */
    getSpans(): readonly RecordedTelemetrySpan[];
}
//# sourceMappingURL=memory.d.ts.map