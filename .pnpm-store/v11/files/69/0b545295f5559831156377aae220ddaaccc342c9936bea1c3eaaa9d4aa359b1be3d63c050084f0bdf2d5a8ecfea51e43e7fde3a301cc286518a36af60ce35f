export { NOOP_TELEMETRY_CONTEXT } from "./noop.js";
/** Typed identity helper for serializable telemetry schema data. */
export function defineTelemetrySchema(schema) {
    return schema;
}
function bindTypedSpanStarter(telemetryContext) {
    const startSpan = (name, attributes, callback) => telemetryContext.startSpan({ name, attributes }, (span) => callback(span, bindTypedSpanStarter(span)));
    return startSpan;
}
/**
 * Bind an explicit parent context to the combined span vocabulary of one or more schemas.
 * Schema values are used only for type inference; no runtime schema validation is performed.
 */
export function createTypedSpanStarter(telemetryContext, _schemas) {
    return bindTypedSpanStarter(telemetryContext);
}
export { InMemoryTelemetryContext } from "./memory.js";
//# sourceMappingURL=index.js.map