/** Exact top-level payload disposition frozen for every released-v0 event type. */
export interface ReleasedV0PayloadDisposition {
    readonly required: readonly string[];
    readonly optional: readonly string[];
    /** JSON members whose nested representation is intentionally owner-opaque. */
    readonly opaque: readonly string[];
}
/**
 * Freeze one exact released payload-member disposition for adjacent format validators.
 * @param required - members that must be present.
 * @param optional - additional admitted members.
 * @param opaque - members retained as lossless JSON without nested semantic inspection.
 * @returns the detached frozen disposition.
 */
export declare function defineReleasedPayloadDisposition(required: readonly string[], optional?: readonly string[], opaque?: readonly string[]): ReleasedV0PayloadDisposition;
/**
 * Frozen released-v0 event and payload-member inventory.
 * Every listed member is preserved by the identity edge. Members in `opaque`
 * remain lossless JSON without nested Session-sequence interpretation. Nested
 * merge-extensible discriminants validate known variants and preserve
 * unknown variants as owner-opaque JSON.
 */
export declare const RELEASED_V0_EVENT_DISPOSITIONS: Readonly<Record<string, ReleasedV0PayloadDisposition>>;
/** Stable sorted released-v0 event inventory. */
export declare const RELEASED_V0_EVENT_TYPES: readonly string[];
//# sourceMappingURL=dispositions.d.ts.map