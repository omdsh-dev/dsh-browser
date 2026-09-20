function startNoopSpan(_options, callback) {
    try {
        return Promise.resolve(callback(noopTelemetrySpan));
    }
    catch (error) {
        return Promise.reject(error);
    }
}
const noopTelemetrySpan = {
    startSpan: startNoopSpan,
    addEvent: () => { },
    setAttributes: () => { },
    setStatus: () => { },
};
Object.freeze(noopTelemetrySpan);
/** Shared telemetry context used when an application does not provide one. */
export const NOOP_TELEMETRY_CONTEXT = noopTelemetrySpan;
//# sourceMappingURL=noop.js.map