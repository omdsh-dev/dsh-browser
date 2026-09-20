import { RELEASED_V0_EVENT_DISPOSITIONS, assertReleasedArtifactRelationships, assertReleasedEventPayload, assertReleasedV1Header, defineReleasedPayloadDisposition, isReleasedAssistantChunkRun, releasedV1SessionFormatCodec } from "@deepseek-ai/dsh-session-format-v0-to-v1";
import { SessionFormatError, SessionFormatUnsupportedMigrationError, defineSessionFormatMigration, sessionFormatCount, sessionFormatSafeInteger, snapshotSessionFormatJson } from "@deepseek-ai/dsh-session-format";
import { isAbsolute } from "node:path";
import { AssistantStreamAccumulator } from "@deepseek-ai/dsh-llm";
//#region lib/types/dispositions.js
const retained = Object.fromEntries(Object.entries(RELEASED_V0_EVENT_DISPOSITIONS).filter(([type]) => type !== "assistant/chunk" && type !== "assistant/message" && type !== "session-log-deepseek/delivery-accepted" && type !== "session/end-seed"));
/** Exact top-level event and payload-member inventory frozen for released v2. */
const RELEASED_V2_EVENT_DISPOSITIONS = Object.freeze({
	...retained,
	"assistant/attempt": defineReleasedPayloadDisposition([
		"turn",
		"step",
		"stream"
	]),
	"assistant/message": defineReleasedPayloadDisposition([
		"turn",
		"step",
		"message",
		"stream"
	], ["usage", "interrupted"]),
	"session-log-deepseek/delivery-accepted": defineReleasedPayloadDisposition(["sessionId", "throughSeq"], ["sessionFormatVersion"]),
	"session/end-seed": defineReleasedPayloadDisposition([], ["inherited"])
});
/** Stable sorted released-v2 event inventory. */
const RELEASED_V2_EVENT_TYPES = Object.freeze(Object.keys(RELEASED_V2_EVENT_DISPOSITIONS).sort((left, right) => left.localeCompare(right, "en")));
//#endregion
//#region lib/types/validation.js
const HEADER_REQUIRED$1 = [
	"version",
	"id",
	"createdAt",
	"isSeeded",
	"delegationDepth"
];
const HEADER_OPTIONAL$1 = [
	"cwd",
	"parentSession",
	"origin",
	"agentPreset"
];
const EVENT_REQUIRED$1 = [
	"type",
	"seq",
	"time",
	"data"
];
const SURFACE_TYPES = new Set([
	"user/message",
	"assistant/message",
	"tool/result"
]);
const SURFACE_OPTIONAL = [
	"ignorable",
	"sourceEventSeqs",
	"surfaceOp"
];
const LOG_OPTIONAL = ["ignorable"];
const RELEASED_V2_RELATIONSHIP_EXTENSIONS = {
	stepEvents: new Set(["assistant/attempt"]),
	preservedSourceTitleRequestText: true
};
/**
* Validate the exact logical header written by released v2.
* @param header - decoded released-v2 Session header.
* @throws {SessionFormatError} when the header is not an exact released-v2 value.
*/
function assertReleasedV2Header(header) {
	const record = releasedV2Record(header, "format v2 header");
	assertReleasedV2Keys(record, HEADER_REQUIRED$1, HEADER_OPTIONAL$1, "format v2 header");
	if (record["version"] !== 2) throw new SessionFormatError("expected format v2 header");
	if (typeof record["id"] !== "string") throw new SessionFormatError("format v2 header id must be a string");
	sessionFormatCount(record["createdAt"], "format v2 header createdAt");
	sessionFormatCount(record["delegationDepth"], "format v2 header delegationDepth");
	if (typeof record["isSeeded"] !== "boolean") throw new SessionFormatError("format v2 header isSeeded must be boolean");
	if (record["cwd"] !== void 0 && (typeof record["cwd"] !== "string" || !isAbsolute(record["cwd"]))) throw new SessionFormatError("format v2 header cwd must be absolute");
	for (const key of ["parentSession", "agentPreset"]) if (record[key] !== void 0 && typeof record[key] !== "string") throw new SessionFormatError(`format v2 header ${key} must be a string`);
	if (record["origin"] !== void 0 && record["origin"] !== "subagent") throw new SessionFormatError("format v2 header origin must be \"subagent\"");
}
function validateReleasedV2Artifact(artifact, mode, knownEventTypes, relationshipHeaderVersion = artifact.header.version) {
	assertReleasedV2Header(artifact.header);
	const cut = sessionFormatCount(artifact.inheritedEventCount, "format v2 inherited event count");
	if (cut > artifact.events.length) throw new SessionFormatError("format v2 inherited event count exceeds its events");
	if (!artifact.header.isSeeded && cut !== 0) throw new SessionFormatError("unseeded format v2 Session has inherited events");
	let lastInheritedMarker;
	for (const [index, event] of artifact.events.entries()) {
		const record = releasedV2Record(event, `format v2 event ${index}`);
		const type = record["type"];
		if (typeof type !== "string") throw new SessionFormatError(`format v2 event ${index} type must be a string`);
		const disposition = RELEASED_V2_EVENT_DISPOSITIONS[type];
		const installed = knownEventTypes?.has(type) === true;
		const ignorableUnknown = disposition === void 0 && record["ignorable"] === true;
		if (mode === "current" && disposition === void 0 && !installed && !ignorableUnknown) throw new SessionFormatUnsupportedMigrationError(`format v2 contains unknown event type ${JSON.stringify(type)} at seq ${index}`);
		const surface = disposition !== void 0 && SURFACE_TYPES.has(type);
		assertReleasedV2Keys(record, EVENT_REQUIRED$1, mode === "physical" || disposition === void 0 ? SURFACE_OPTIONAL : surface ? SURFACE_OPTIONAL : LOG_OPTIONAL, `format v2 event ${index}`);
		if (record["seq"] !== index) throw new SessionFormatError(`format v2 event ${index} is not dense`);
		sessionFormatSafeInteger(record["time"], `format v2 event ${index} time`);
		if (record["ignorable"] !== void 0 && record["ignorable"] !== true) throw new SessionFormatError(`format v2 event ${index} ignorable must be true when present`);
		if (type === "session/end-seed") {
			if (releasedV2Record(event.data, `session/end-seed ${index} data`)["inherited"] === true) lastInheritedMarker = index;
		}
	}
	if (artifact.header.isSeeded && lastInheritedMarker !== cut) throw new SessionFormatError("format v2 seeded header disagrees with its last inherited end-seed marker");
	if (!artifact.header.isSeeded && lastInheritedMarker !== void 0) throw new SessionFormatError("format v2 unseeded Session contains an inherited end-seed marker");
	if (mode === "current") assertReleasedArtifactRelationships({
		...artifact,
		header: {
			...artifact.header,
			version: relationshipHeaderVersion
		}
	}, RELEASED_V2_RELATIONSHIP_EXTENSIONS);
}
/**
* Require one released-v2 value to be a JSON object.
* @param value - value to narrow.
* @param label - diagnostic subject.
* @returns the narrowed object.
*/
function releasedV2Record(value, label) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new SessionFormatError(`${label} must be an object`);
	return value;
}
/**
* Require one released-v2 object to contain exactly the admitted keys.
* @param value - object to inspect.
* @param required - keys that must be present.
* @param optional - additional keys that may be present.
* @param label - diagnostic subject.
*/
function assertReleasedV2Keys(value, required, optional, label) {
	const allowed = new Set([...required, ...optional]);
	const missing = required.find((key) => !Object.hasOwn(value, key));
	if (missing !== void 0) throw new SessionFormatError(`${label} lacks required field ${missing}`);
	const unexpected = Object.keys(value).find((key) => !allowed.has(key));
	if (unexpected !== void 0) throw new SessionFormatError(`${label} has unexpected field ${unexpected}`);
}
/**
* Restore and validate one decoded released-v2 artifact.
* @param artifact - detached vocabulary-restored artifact.
* @param knownEventTypes - event types understood by the installed current Session package.
* @param relationshipHeaderVersion - logical generation whose version-sensitive relationships are checked.
* @returns the same validated artifact.
*/
function restoreReleasedV2Artifact(artifact, knownEventTypes, relationshipHeaderVersion = artifact.header.version) {
	validateReleasedV2Artifact(artifact, "current", knownEventTypes, relationshipHeaderVersion);
	return artifact;
}
//#endregion
//#region lib/types/codec.js
const HEADER_REQUIRED = [
	"type",
	"version",
	"id",
	"createdAt",
	"isSeeded",
	"delegationDepth"
];
const HEADER_OPTIONAL = [
	"cwd",
	"parentSession",
	"origin",
	"agentPreset"
];
const EVENT_REQUIRED = [
	"type",
	"seq",
	"time",
	"data"
];
const EVENT_OPTIONAL = [
	"ignorable",
	"sourceEventSeqs",
	"surfaceOp"
];
const EVENT_KEYS = new Set([...EVENT_REQUIRED, ...EVENT_OPTIONAL]);
/** Frozen physical JSON codec for released v2. */
const releasedV2SessionFormatCodec = Object.freeze({
	version: 2,
	decodeHeader(value) {
		return decodePhysicalHeader(value);
	},
	createDecoder(headerValue, recovery) {
		return createDecoder(headerValue, recovery);
	},
	encodeHeader(header, inheritedEventCount) {
		return encodeHeader(header, inheritedEventCount);
	},
	encodeEvent(event) {
		return encodeProvenance(event);
	}
});
function decodePhysicalHeader(value) {
	const record = jsonRecord(snapshotSessionFormatJson(value, "released v2 physical header"), "released v2 physical header");
	exactKeys(record, HEADER_REQUIRED, HEADER_OPTIONAL, "released v2 physical header");
	if (record["type"] !== "session" || record["version"] !== 2) throw new SessionFormatError("expected released v2 physical Session header");
	if (typeof record["id"] !== "string") throw new SessionFormatError("released v2 header id must be a string");
	const createdAt = sessionFormatCount(record["createdAt"], "released v2 header createdAt");
	const delegationDepth = sessionFormatCount(record["delegationDepth"], "released v2 header delegationDepth");
	if (typeof record["isSeeded"] !== "boolean") throw new SessionFormatError("released v2 header isSeeded must be boolean");
	for (const key of [
		"cwd",
		"parentSession",
		"agentPreset"
	]) if (record[key] !== void 0 && typeof record[key] !== "string") throw new SessionFormatError(`released v2 header ${key} must be a string`);
	if (record["origin"] !== void 0 && record["origin"] !== "subagent") throw new SessionFormatError("released v2 header origin must be \"subagent\"");
	const header = snapshotSessionFormatJson({
		version: 2,
		id: record["id"],
		createdAt,
		...record["cwd"] === void 0 ? {} : { cwd: record["cwd"] },
		...record["parentSession"] === void 0 ? {} : { parentSession: record["parentSession"] },
		isSeeded: record["isSeeded"],
		...record["origin"] === void 0 ? {} : { origin: record["origin"] },
		delegationDepth,
		...record["agentPreset"] === void 0 ? {} : { agentPreset: record["agentPreset"] }
	}, "released v2 logical header");
	assertReleasedV2Header(header);
	return header;
}
function createDecoder(headerValue, recovery) {
	const header = decodePhysicalHeader(headerValue);
	let rowIndex = 0;
	let eventCount = 0;
	let inheritedEventCount;
	let issue;
	return {
		header,
		decodeRow(value, context) {
			const currentRow = rowIndex;
			rowIndex += 1;
			let event;
			try {
				event = decodeEvent(value, currentRow);
			} catch (error) {
				const current = error instanceof SessionFormatError ? error : new SessionFormatError(`released v2 row ${currentRow} is malformed`, { cause: error });
				if (recovery === "strict") throw current;
				issue ??= current;
				return;
			}
			if (issue !== void 0) {
				if (event.type === "turn/end") throw issue;
				return;
			}
			if (event.seq !== eventCount) {
				const gap = new SessionFormatError(`released v2 row ${currentRow} has seq gap (expected ${eventCount}, got ${event.seq})`);
				if (recovery === "strict") throw gap;
				issue = gap;
				if (event.type === "turn/end") throw issue;
				return;
			}
			eventCount += 1;
			if (event.type === "session/end-seed") {
				if (jsonRecord(event.data, `session/end-seed ${event.seq} data`)["inherited"] === true) inheritedEventCount = event.seq;
			}
			context.emitEvent(event);
		},
		finish(_context) {
			if (header.isSeeded && inheritedEventCount === void 0) throw new SessionFormatError("released v2 seeded Session lacks an inherited end-seed marker");
			if (!header.isSeeded && inheritedEventCount !== void 0) throw new SessionFormatError("released v2 unseeded Session contains an inherited end-seed marker");
			return inheritedEventCount ?? 0;
		}
	};
}
function decodeEvent(value, rowIndex) {
	const record = jsonRecord(value, `released v2 row ${rowIndex}`);
	const missing = EVENT_REQUIRED.find((key) => !Object.hasOwn(record, key));
	if (missing !== void 0) throw new SessionFormatError(`released v2 row ${rowIndex} lacks required field ${missing}`);
	const unexpected = Object.keys(record).find((key) => !EVENT_KEYS.has(key));
	if (unexpected !== void 0) throw new SessionFormatError(`released v2 row ${rowIndex} has unexpected field ${unexpected}`);
	if (typeof record["type"] !== "string") throw new SessionFormatError(`released v2 row ${rowIndex} type must be a string`);
	sessionFormatSafeInteger(record["time"], `released v2 row ${rowIndex} time`);
	if (record["ignorable"] !== void 0 && record["ignorable"] !== true) throw new SessionFormatError(`released v2 row ${rowIndex} ignorable must be true when present`);
	if (record["sourceEventSeqs"] === void 0) return record;
	const seq = sessionFormatCount(record["seq"], `released v2 row ${rowIndex} seq`);
	return {
		...record,
		sourceEventSeqs: decodeSeqRanges(record["sourceEventSeqs"], seq)
	};
}
function encodeHeader(header, inheritedEventCount) {
	assertReleasedV2Header(header);
	const cut = sessionFormatCount(inheritedEventCount, "format v2 inherited event count");
	if (!header.isSeeded && cut !== 0) throw new SessionFormatError("unseeded format v2 Session has inherited events");
	return {
		type: "session",
		version: 2,
		id: header.id,
		createdAt: header.createdAt,
		...header.cwd === void 0 ? {} : { cwd: header.cwd },
		...header.parentSession === void 0 ? {} : { parentSession: header.parentSession },
		isSeeded: header.isSeeded,
		...header.origin === void 0 ? {} : { origin: header.origin },
		delegationDepth: header.delegationDepth,
		...header.agentPreset === void 0 ? {} : { agentPreset: header.agentPreset }
	};
}
function encodeProvenance(event) {
	if (event.sourceEventSeqs === void 0) return event;
	return {
		...event,
		sourceEventSeqs: encodeSeqRanges(event.sourceEventSeqs)
	};
}
function decodeSeqRanges(value, maxEntries) {
	if (!Array.isArray(value)) throw new SessionFormatError("sourceEventSeqs must be an array");
	const output = [];
	let hasRange = false;
	for (const entry of value) {
		if (!Array.isArray(entry)) {
			output.push(sessionFormatCount(entry, "sourceEventSeqs member"));
			continue;
		}
		if (entry.length !== 2) throw new SessionFormatError("sourceEventSeqs range must be a [start, end] pair");
		const start = sessionFormatCount(entry[0], "sourceEventSeqs range start");
		const end = sessionFormatCount(entry[1], "sourceEventSeqs range end");
		if (start > end || end >= maxEntries || end - start + 1 > maxEntries - output.length) throw new SessionFormatError("sourceEventSeqs range exceeds its event seq");
		for (let current = start; current <= end; current += 1) output.push(current);
		hasRange = true;
	}
	const seen = /* @__PURE__ */ new Set();
	for (const source of output) {
		if (source >= maxEntries || seen.has(source)) throw new SessionFormatError("sourceEventSeqs ranges must contain unique earlier seqs");
		seen.add(source);
	}
	if (hasRange && output.some((source, index) => index > 0 && source <= output[index - 1])) throw new SessionFormatError("sourceEventSeqs ranges must be strictly increasing");
	return output;
}
function encodeSeqRanges(values) {
	if (values.some((value, index) => index > 0 && value <= values[index - 1])) return [...values];
	const output = [];
	for (let index = 0; index < values.length;) {
		const start = values[index];
		let end = start;
		while (index + 1 < values.length && values[index + 1] === end + 1) {
			index += 1;
			end += 1;
		}
		output.push(end - start >= 2 ? [start, end] : start);
		if (end - start === 1) output.push(end);
		index += 1;
	}
	return output;
}
function jsonRecord(value, label) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new SessionFormatError(`${label} must be an object`);
	return value;
}
function exactKeys(record, required, optional, label) {
	const allowed = new Set([...required, ...optional]);
	const missing = required.find((key) => !Object.hasOwn(record, key));
	if (missing !== void 0) throw new SessionFormatError(`${label} lacks ${missing}`);
	const unexpected = Object.keys(record).find((key) => !allowed.has(key));
	if (unexpected !== void 0) throw new SessionFormatError(`${label} has unexpected field ${unexpected}`);
}
//#endregion
//#region lib/types/migration.js
const CHUNK_EVENT_REQUIRED = [
	"type",
	"seq",
	"time",
	"data"
];
const CHUNK_EVENT_OPTIONAL = [
	"ignorable",
	"sourceEventSeqs",
	"surfaceOp"
];
const CHUNK_EVENT_KEYS = new Set([...CHUNK_EVENT_REQUIRED, ...CHUNK_EVENT_OPTIONAL]);
/** Adjacent migration that embeds released-v1 top-level Assistant chunks into v2 attempt events. */
const sessionFormatV1ToV2 = defineSessionFormatMigration({
	name: "@deepseek-ai/dsh-session-format-v1-to-v2",
	fromVersion: 1,
	toVersion: 2,
	migrateHeader(header) {
		assertReleasedV1Header(header);
		return {
			...header,
			version: 2
		};
	},
	createStage(input) {
		return input.sourceKind === "decoded" ? new DecodedReleasedV1ToV2Stage(input) : new TransformedReleasedV1ToV2Stage(input);
	},
	validateTargetHeader: assertReleasedV2Header
});
var TransformedReleasedV1ToV2Stage = class {
	state;
	constructor(input) {
		assertReleasedV1Header(input.sourceHeader);
		this.state = {
			sourceHeader: input.sourceHeader,
			sourceCut: sessionFormatCount(input.sourceInheritedEventCount, "format v1 inherited event count"),
			mapping: /* @__PURE__ */ new Map(),
			legacyTurns: legacyTurnState(),
			pending: void 0,
			targetSeq: 0,
			targetCut: input.sourceHeader.isSeeded ? void 0 : 0,
			lastTime: input.sourceHeader.createdAt
		};
	}
	transformEvent(event, context) {
		transformReleasedEvent(this.state, event, context);
	}
	transformRun(run, context) {
		transformReleasedRun(this.state, run, context);
	}
	finish(context) {
		return finishMigration(this.state, context);
	}
};
var DecodedReleasedV1ToV2Stage = class extends TransformedReleasedV1ToV2Stage {
	transformEvent(event, context) {
		if (event.type !== "assistant/chunk" && RELEASED_V0_EVENT_DISPOSITIONS[event.type] !== void 0) assertReleasedEventPayload(event, 1);
		super.transformEvent(event, context);
	}
};
function transformReleasedEvent(state, event, context) {
	if (event.type === "assistant/chunk") assertChunkEnvelope(event);
	if (RELEASED_V0_EVENT_DISPOSITIONS[event.type] === void 0) throw refusal(`format v1 contains unknown event type ${JSON.stringify(event.type)} at seq ${event.seq}`);
	const interrupted = legacyInterruptedTurn(state.legacyTurns, event);
	if (event.type === "turn/start" && state.legacyTurns.openTurn !== null && interrupted === void 0) throw refusal(`turn/start ${JSON.stringify(record(event.data)["turn"])} does not close the prior turn`);
	assertSourceDeliveryMarker(state, event);
	observeLegacyTurn(state.legacyTurns, event);
	state.lastTime = event.time;
	if (interrupted !== void 0) {
		finishAttempt(state, context);
		emitGenerated(state, event.seq, interrupted, context);
	}
	const legacyGoal = splitLegacyGoalChange(event);
	if (legacyGoal !== void 0) {
		emitGenerated(state, event.seq, legacyGoal.change, context);
		emitSource(state, legacyGoal.message, context);
		return;
	}
	if (event.type === "assistant/chunk") {
		transformChunk(state, event, context);
		return;
	}
	if (event.type === "assistant/message") {
		transformMessage(state, event, context);
		return;
	}
	if (closesAttempt(event)) {
		finishAttempt(state, context);
		emitSource(state, event, context);
		return;
	}
	if (state.pending !== void 0) {
		state.pending.afterLastChunk.push(event);
		return;
	}
	emitSource(state, event, context);
}
function assertChunkEnvelope(event) {
	const unexpected = Object.keys(event).find((key) => !CHUNK_EVENT_KEYS.has(key));
	if (unexpected !== void 0) throw refusal(`assistant/chunk ${event.seq} has unexpected member ${unexpected}`);
	const missing = CHUNK_EVENT_REQUIRED.find((key) => !Object.hasOwn(event, key));
	if (missing !== void 0) throw refusal(`assistant/chunk ${event.seq} lacks required member ${missing}`);
	if (event.ignorable !== void 0 && event.ignorable !== true) throw refusal(`assistant/chunk ${event.seq} ignorable must be true when present`);
}
function assertSourceDeliveryMarker(state, event) {
	if (event.type !== "session-log-deepseek/delivery-accepted") return;
	const data = record(event.data);
	const inherited = state.sourceHeader.parentSession !== void 0 && event.seq < state.sourceCut;
	if (data["sessionFormatVersion"] === 1 && !inherited && data["sessionId"] !== state.sourceHeader.id) throw refusal("current-generation delivery marker names the wrong Session");
}
function transformReleasedRun(state, run, context) {
	if (!isReleasedAssistantChunkRun(run)) {
		for (const event of run.expand()) transformReleasedEvent(state, event, context);
		return;
	}
	state.legacyTurns.previous = void 0;
	state.lastTime = run.lastTime;
	if (state.pending !== void 0 && (state.pending.group.terminal || state.pending.group.turn !== run.turn || state.pending.group.step !== run.step)) finishAttempt(state, context);
	else if (state.pending !== void 0) flushBuffered(state, state.pending, context);
	state.pending ??= {
		group: attemptGroup(run.turn, run.step),
		afterLastChunk: []
	};
	assertAttemptRange(state, run.firstSeq, run.lastSeq);
	flushAccumulator(state.pending.group);
	appendStreamRecord(state.pending.group, run.stream, run.lastTime);
	recordChunkSpan(state.pending.group, run.firstSeq, run.eventCount, run.lastTime);
}
function finishMigration(state, context) {
	finishAttempt(state, context);
	if (state.sourceHeader.isSeeded && state.targetCut === void 0) {
		state.targetCut = state.targetSeq;
		context.emitEvent({
			type: "session/end-seed",
			seq: state.targetSeq,
			time: state.lastTime,
			data: { inherited: true }
		});
		state.targetSeq += 1;
	}
	return state.targetCut;
}
function transformChunk(state, event, context) {
	const data = record(event.data);
	const turn = coordinate(data["turn"]);
	const step = coordinate(data["step"]);
	const chunk = record(data["chunk"]);
	if (state.pending !== void 0 && (state.pending.group.terminal || state.pending.group.turn !== turn || state.pending.group.step !== step)) finishAttempt(state, context);
	else if (state.pending !== void 0) flushBuffered(state, state.pending, context);
	state.pending ??= {
		group: attemptGroup(turn, step),
		afterLastChunk: []
	};
	assertAttemptCut(state, state.pending.group, event.seq);
	state.pending.group.accumulator ??= new AssistantStreamAccumulator();
	state.pending.group.accumulator.push({
		time: event.time,
		chunk: data["chunk"]
	});
	recordChunkSpan(state.pending.group, event.seq, 1, event.time);
	if (chunk["type"] === "finish") state.pending.group.terminal = true;
}
function transformMessage(state, event, context) {
	const data = record(event.data);
	const turn = coordinate(data["turn"]);
	const step = coordinate(data["step"]);
	const sources = event.sourceEventSeqs;
	const pending = state.pending;
	if (pending !== void 0 && (pending.group.turn !== turn || pending.group.step !== step)) {
		finishAttempt(state, context);
		emitSource(state, messageEvent(event, attemptGroup(turn, step)), context);
		return;
	}
	if (!Array.isArray(sources)) {
		if (pending !== void 0) throw refusal(`assistant/message ${event.seq} does not cite its complete v1 chunk attempt`);
		emitSource(state, messageEvent(event, attemptGroup(turn, step)), context);
		return;
	}
	if (sources.length === 0) {
		finishAttempt(state, context);
		emitSource(state, messageEvent(event, attemptGroup(turn, step)), context);
		return;
	}
	if (pending === void 0 || !matchesChunkSources(pending.group, sources)) throw refusal(`assistant/message ${event.seq} chunk provenance is not one complete ordered attempt`);
	assertAttemptCut(state, pending.group, event.seq);
	pending.group.terminal = true;
	flushBuffered(state, pending, context);
	emitSource(state, messageEvent(event, pending.group), context);
	state.pending = void 0;
}
function finishAttempt(state, context) {
	const pending = state.pending;
	if (pending === void 0) return;
	emitGenerated(state, pending.group.lastChunkSeq, attemptEvent(pending.group), context);
	flushBuffered(state, pending, context);
	state.pending = void 0;
}
function flushBuffered(state, pending, context) {
	for (const event of pending.afterLastChunk) emitSource(state, event, context);
	pending.afterLastChunk.length = 0;
}
function emitSource(state, event, context) {
	let source = event;
	if (state.sourceHeader.isSeeded && event.seq === state.sourceCut && event.type === "session/end-seed") source = {
		...event,
		data: { inherited: true }
	};
	ensureTargetCut(state, event.seq, event.time, source.type, context);
	state.mapping.set(event.seq, state.targetSeq);
	context.emitEvent(remapReferences(source, state.targetSeq, state.mapping));
	state.targetSeq += 1;
}
function emitGenerated(state, origin, event, context) {
	ensureTargetCut(state, origin, event.time, event.type, context);
	context.emitEvent(remapReferences(event, state.targetSeq, state.mapping));
	state.targetSeq += 1;
}
function ensureTargetCut(state, origin, time, type, context) {
	if (!state.sourceHeader.isSeeded || state.targetCut !== void 0 || origin < state.sourceCut) return;
	state.targetCut = state.targetSeq;
	if (origin === state.sourceCut && type === "session/end-seed") return;
	context.emitEvent({
		type: "session/end-seed",
		seq: state.targetSeq,
		time,
		data: { inherited: true }
	});
	state.targetSeq += 1;
}
function assertAttemptCut(state, group, member) {
	if ((group.spans[0]?.firstSeq ?? member) < state.sourceCut !== member < state.sourceCut) throw refusal(`inherited Session cut ${state.sourceCut} splits one Assistant attempt`);
}
function assertAttemptRange(state, first, last) {
	if (first < state.sourceCut !== last < state.sourceCut) throw refusal(`inherited Session cut ${state.sourceCut} splits one Assistant attempt`);
}
function legacyTurnState() {
	return {
		openTurn: null,
		openStep: null,
		previous: void 0
	};
}
function legacyInterruptedTurn(state, event) {
	if (event.type !== "turn/start" || state.openTurn === null || state.openStep !== null || coordinate(record(event.data)["turn"]) !== state.openTurn + 1 || state.previous?.type !== "agent/inbox/spliced") return void 0;
	const splice = record(state.previous.data);
	if (splice["target"] !== "next-turn" || !Array.isArray(splice["inserted"]) || splice["inserted"].length === 0) return;
	return {
		type: "turn/end",
		seq: event.seq,
		time: event.time,
		data: {
			turn: state.openTurn,
			reason: { kind: "interrupted" }
		}
	};
}
function observeLegacyTurn(state, event) {
	const data = record(event.data);
	if (event.type === "turn/start") {
		state.openTurn = coordinate(data["turn"]);
		state.openStep = null;
	} else if (event.type === "turn/end") {
		state.openTurn = null;
		state.openStep = null;
	} else if (event.type === "step/start") state.openStep = coordinate(data["step"]);
	else if (event.type === "step/end") state.openStep = null;
	state.previous = event;
}
function splitLegacyGoalChange(event) {
	if (event.type !== "user/message") return void 0;
	const data = record(event.data);
	const source = record(data["source"]);
	if (source["kind"] !== "goal" || source["change"] === void 0) return void 0;
	return {
		change: {
			type: "goal/change",
			seq: event.seq,
			time: event.time,
			data: source["change"]
		},
		message: {
			...event,
			data: {
				...data,
				source: {
					kind: "plugin",
					plugin: "goal"
				}
			}
		}
	};
}
function closesAttempt(event) {
	return event.type === "turn/end" || event.type === "step/end" || event.type === "llm/retry" || event.type === "llm/retry-started";
}
function attemptGroup(turn, step) {
	return {
		turn,
		step,
		spans: [],
		stream: [],
		chunkCount: 0,
		terminal: false
	};
}
function recordChunkSpan(group, firstSeq, eventCount, lastTime) {
	const previous = group.spans.at(-1);
	if (previous !== void 0 && previous.firstSeq + previous.eventCount === firstSeq) previous.eventCount += eventCount;
	else group.spans.push({
		firstSeq,
		eventCount
	});
	group.chunkCount += eventCount;
	group.lastChunkSeq = firstSeq + eventCount - 1;
	group.lastChunkTime = lastTime;
}
function matchesChunkSources(group, sources) {
	if (sources.length !== group.chunkCount) return false;
	let index = 0;
	for (const span of group.spans) for (let offset = 0; offset < span.eventCount; offset += 1) {
		if (sources[index] !== span.firstSeq + offset) return false;
		index += 1;
	}
	return true;
}
function recordLastTime(record) {
	if (record.type === "chunk") return record.time;
	return record.dt.reduce((time, gap) => time + gap, record.time0);
}
function mutableRecord(record) {
	if (record.type === "chunk") return record;
	if (record.type === "tool-call-chunks") return {
		...record,
		dt: [...record.dt],
		args: [...record.args]
	};
	return {
		...record,
		dt: [...record.dt],
		texts: [...record.texts]
	};
}
function appendStreamRecord(group, source, lastTime, owned = true) {
	const previous = group.stream.at(-1);
	if (previous === void 0 || source.type === "chunk" || previous.record.type !== source.type) {
		group.stream.push({
			record: owned ? source : mutableRecord(source),
			lastTime
		});
		return;
	}
	const gap = source.time0 - previous.lastTime;
	if (previous.record.index !== source.index || !Number.isSafeInteger(gap)) {
		group.stream.push({
			record: owned ? source : mutableRecord(source),
			lastTime
		});
		return;
	}
	if (source.type === "tool-call-chunks") {
		const target = previous.record;
		if (target.id !== source.id || target.name !== source.name) {
			group.stream.push({
				record: owned ? source : mutableRecord(source),
				lastTime
			});
			return;
		}
		target.dt.push(gap);
		for (const value of source.dt) target.dt.push(value);
		for (const value of source.args) target.args.push(value);
	} else {
		const target = previous.record;
		target.dt.push(gap);
		for (const value of source.dt) target.dt.push(value);
		for (const value of source.texts) target.texts.push(value);
	}
	previous.lastTime = lastTime;
}
function flushAccumulator(group) {
	const accumulator = group.accumulator;
	if (accumulator === void 0) return;
	for (const record of accumulator.snapshot()) appendStreamRecord(group, record, recordLastTime(record), false);
	delete group.accumulator;
}
function streamOf(group) {
	flushAccumulator(group);
	return group.stream.map(({ record }) => record);
}
function messageEvent(source, group) {
	const data = record(source.data);
	const { sourceEventSeqs: _sourceEventSeqs, ...event } = source;
	return {
		...event,
		data: {
			...data,
			stream: streamOf(group)
		}
	};
}
function attemptEvent(group) {
	return {
		type: "assistant/attempt",
		seq: group.lastChunkSeq,
		time: group.lastChunkTime,
		data: {
			turn: group.turn,
			step: group.step,
			stream: streamOf(group)
		}
	};
}
function remapReferences(source, targetSeq, mapping) {
	const { sourceEventSeqs, surfaceOp, ...event } = source;
	const sources = sourceEventSeqs === void 0 ? {} : { sourceEventSeqs: mapList(numberArray(sourceEventSeqs), mapping, `${source.type} ${source.seq} sources`) };
	let operation = surfaceOp;
	if (surfaceOp !== void 0 && surfaceOp !== "append") {
		const replacement = record(surfaceOp);
		operation = {
			op: "replace",
			start: mapOne(coordinate(replacement["start"]), mapping, `${source.type} ${source.seq} surface start`),
			end: mapOne(coordinate(replacement["end"]), mapping, `${source.type} ${source.seq} surface end`)
		};
	}
	return {
		...event,
		seq: targetSeq,
		data: remapPayloadReferences(source, mapping),
		...sources,
		...operation === void 0 ? {} : { surfaceOp: operation }
	};
}
function remapPayloadReferences(event, mapping) {
	const data = record(event.data);
	switch (event.type) {
		case "command/done": return data["sourceEventSeq"] === void 0 ? data : {
			...data,
			sourceEventSeq: mapOne(coordinate(data["sourceEventSeq"]), mapping, `command/done ${event.seq} sourceEventSeq`)
		};
		case "compaction/prune":
		case "compaction/summary": {
			const range = record(data["shadowedRange"]);
			return {
				...data,
				shadowedRange: {
					start: mapOne(coordinate(range["start"]), mapping, `${event.type} ${event.seq} shadowedRange start`),
					end: mapOne(coordinate(range["end"]), mapping, `${event.type} ${event.seq} shadowedRange end`)
				},
				shadowedSeqs: mapList(numberArray(data["shadowedSeqs"]), mapping, `${event.type} ${event.seq} shadowedSeqs`)
			};
		}
		case "session/title":
		case "session/title-llm-request": return {
			...data,
			messageSeqs: mapList(numberArray(data["messageSeqs"]), mapping, `${event.type} ${event.seq} messageSeqs`)
		};
		default: return data;
	}
}
function mapList(values, mapping, label) {
	return values.map((value) => mapOne(value, mapping, label));
}
function mapOne(value, mapping, label) {
	const mapped = mapping.get(value);
	if (mapped === void 0) throw refusal(`${label} targets consumed assistant/chunk ${value}`);
	return mapped;
}
function record(value) {
	return value;
}
function numberArray(value) {
	return value;
}
function coordinate(value) {
	return value;
}
function refusal(message) {
	return new SessionFormatUnsupportedMigrationError(message);
}
//#endregion
export { RELEASED_V2_EVENT_DISPOSITIONS, RELEASED_V2_EVENT_TYPES, assertReleasedV2Header, releasedV1SessionFormatCodec, releasedV2SessionFormatCodec, restoreReleasedV2Artifact, sessionFormatV1ToV2 };
