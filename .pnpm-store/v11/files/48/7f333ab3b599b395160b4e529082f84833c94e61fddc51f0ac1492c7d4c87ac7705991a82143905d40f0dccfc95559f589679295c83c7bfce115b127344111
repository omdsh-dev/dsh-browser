import { NOOP_TELEMETRY_CONTEXT } from "./noop.js";
function copyAttributeValue(value) {
    return Array.isArray(value) ? [...value] : value;
}
function copyAttributes(attributes) {
    const copy = {};
    if (!attributes)
        return copy;
    for (const [name, value] of Object.entries(attributes)) {
        if (value !== undefined)
            copy[name] = copyAttributeValue(value);
    }
    return copy;
}
function mergeAttributes(current, attributes) {
    const merged = copyAttributes(current);
    for (const [name, value] of Object.entries(attributes)) {
        if (value !== undefined)
            merged[name] = copyAttributeValue(value);
    }
    return merged;
}
function copyStatus(status) {
    if (status.status === "ok")
        return { status: "ok" };
    return status.error
        ? { status: "error", error: { name: status.error.name, message: status.error.message } }
        : { status: "error" };
}
function automaticErrorStatus(error) {
    try {
        if (error instanceof Error) {
            return { status: "error", error: { name: error.name, message: error.message } };
        }
    }
    catch {
        // Error inspection is passive. Fall through to an error status without details.
    }
    return { status: "error" };
}
function settleSpan(state, span, failed, error) {
    if (span.settled)
        return;
    if (failed && !span.explicitStatus)
        span.status = automaticErrorStatus(error);
    span.settled = true;
    span.endSequence = state.nextEndSequence++;
}
function createSpan(state, parent, options) {
    const name = options.name;
    const attributes = copyAttributes(options.attributes);
    return {
        id: state.nextSpanId++,
        parentId: parent?.id ?? null,
        name,
        attributes,
        events: [],
        status: { status: "ok" },
        explicitStatus: false,
        settled: false,
    };
}
function startInMemorySpan(state, parent, options, callback) {
    if (parent?.settled)
        return NOOP_TELEMETRY_CONTEXT.startSpan(options, callback);
    let recordedSpan;
    try {
        recordedSpan = createSpan(state, parent, options);
        state.spans.push(recordedSpan);
    }
    catch {
        return NOOP_TELEMETRY_CONTEXT.startSpan(options, callback);
    }
    const span = {
        startSpan: (childOptions, childCallback) => startInMemorySpan(state, recordedSpan, childOptions, childCallback),
        addEvent(name, attributes) {
            if (recordedSpan.settled)
                return;
            try {
                recordedSpan.events.push({ name, attributes: copyAttributes(attributes) });
            }
            catch {
                // Recording is passive. Ignore malformed or unreadable telemetry payloads.
            }
        },
        setAttributes(attributes) {
            if (recordedSpan.settled)
                return;
            try {
                recordedSpan.attributes = mergeAttributes(recordedSpan.attributes, attributes);
            }
            catch {
                // Recording is passive. Ignore malformed or unreadable telemetry payloads.
            }
        },
        setStatus(status) {
            if (recordedSpan.settled)
                return;
            try {
                recordedSpan.status = copyStatus(status);
                recordedSpan.explicitStatus = true;
            }
            catch {
                // Recording is passive. Ignore malformed or unreadable telemetry payloads.
            }
        },
    };
    let result;
    try {
        result = callback(span);
    }
    catch (error) {
        settleSpan(state, recordedSpan, true, error);
        return Promise.reject(error);
    }
    return Promise.resolve(result).then((value) => {
        settleSpan(state, recordedSpan, false);
        return value;
    }, (error) => {
        settleSpan(state, recordedSpan, true, error);
        throw error;
    });
}
/**
 * Backend-neutral reference implementation that records spans in process memory.
 * Create a fresh instance to isolate tests or independent recording scopes.
 */
export class InMemoryTelemetryContext {
    state = {
        spans: [],
        nextSpanId: 1,
        nextEndSequence: 1,
    };
    startSpan(options, callback) {
        return startInMemorySpan(this.state, undefined, options, callback);
    }
    /** Returns detached snapshots in span-start order. */
    getSpans() {
        return this.state.spans.map((span) => ({
            id: span.id,
            parentId: span.parentId,
            name: span.name,
            attributes: copyAttributes(span.attributes),
            events: span.events.map((event) => ({
                name: event.name,
                attributes: copyAttributes(event.attributes),
            })),
            status: copyStatus(span.status),
            settled: span.settled,
            ...(span.endSequence === undefined ? {} : { endSequence: span.endSequence }),
        }));
    }
}
//# sourceMappingURL=memory.js.map