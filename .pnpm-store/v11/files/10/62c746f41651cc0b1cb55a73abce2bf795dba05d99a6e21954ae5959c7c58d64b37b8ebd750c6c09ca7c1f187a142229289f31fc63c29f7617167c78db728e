"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accumulateManagedAgentsEvent = accumulateManagedAgentsEvent;
const error_1 = require("../../core/error.js");
function accumulateManagedAgentsEvent(accumulated, event) {
    switch (event.type) {
        case 'event_start': {
            if (event.event.type === 'agent.message') {
                return { id: event.event.id, type: 'agent.message', content: [], processed_at: '' };
            }
            return accumulated;
        }
        case 'agent.message': {
            return { ...event, content: event.content.map((block) => ({ ...block })) };
        }
        case 'event_delta': {
            if (accumulated === undefined) {
                throw new error_1.AnthropicError(`event_delta for ${event.event_id} received before its event_start`);
            }
            const idx = event.delta.index ?? 0;
            const fragment = event.delta.content;
            // Indices arrive in order — the first delta at a new index opens the slot.
            // A gap means deltas arrived out of order or were mis-routed.
            if (idx > accumulated.content.length) {
                throw new error_1.AnthropicError(`event_delta index ${idx} is beyond the end of content (length ${accumulated.content.length})`);
            }
            const existing = accumulated.content[idx];
            if (existing === undefined) {
                // New index: pass the fragment through as a fresh block.
                return { ...accumulated, content: [...accumulated.content, { ...fragment }] };
            }
            let updated = existing;
            if (fragment.type === 'text' && existing.type === 'text') {
                updated = { ...existing, text: existing.text + fragment.text };
            }
            const content = accumulated.content.slice();
            content[idx] = updated;
            return { ...accumulated, content };
        }
        default:
            // Any other event, including types newer than this SDK, leaves the snapshot unchanged.
            return accumulated;
    }
}
//# sourceMappingURL=accumulate.js.map