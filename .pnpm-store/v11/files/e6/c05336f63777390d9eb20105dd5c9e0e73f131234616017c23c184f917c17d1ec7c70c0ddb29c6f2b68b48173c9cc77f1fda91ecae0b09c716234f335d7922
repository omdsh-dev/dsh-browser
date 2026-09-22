import { SessionFormatError, SessionFormatUnsupportedMigrationError, defineSessionFormatMigration, isSessionFormatJsonObject, sessionFormatCount, sessionFormatSafeInteger, snapshotSessionFormatJson } from "@deepseek-ai/dsh-session-format";
import { isAbsolute } from "node:path";
import { deepEqualJson, isJsonValue } from "@deepseek-ai/dsh-util-values";
//#region lib/types/dispositions.js
/**
* Freeze one exact released payload-member disposition for adjacent format validators.
* @param required - members that must be present.
* @param optional - additional admitted members.
* @param opaque - members retained as lossless JSON without nested semantic inspection.
* @returns the detached frozen disposition.
*/
function defineReleasedPayloadDisposition(required, optional = [], opaque = []) {
	return Object.freeze({
		required: Object.freeze([...required]),
		optional: Object.freeze([...optional]),
		opaque: Object.freeze([...opaque])
	});
}
const disposition = defineReleasedPayloadDisposition;
/**
* Frozen released-v0 event and payload-member inventory.
* Every listed member is preserved by the identity edge. Members in `opaque`
* remain lossless JSON without nested Session-sequence interpretation. Nested
* merge-extensible discriminants validate known variants and preserve
* unknown variants as owner-opaque JSON.
*/
const RELEASED_V0_EVENT_DISPOSITIONS = Object.freeze({
	"agent-preset/selected": disposition(["agentPreset"]),
	"agent/inbox/spliced": disposition([
		"target",
		"start",
		"inserted"
	], ["removedCount", "outcome"]),
	"approval/asked": disposition(["id", "toolName"], ["callId", "reason"]),
	"approval/decided": disposition(["id", "outcome"]),
	"approval/policy": disposition(["policy"], ["source"]),
	"assistant/chunk": disposition([
		"turn",
		"step",
		"chunk"
	]),
	"assistant/message": disposition([
		"turn",
		"step",
		"message"
	], ["usage", "interrupted"]),
	"command/done": disposition(["commandId", "kind"], ["text", "sourceEventSeq"]),
	"command/run": disposition([
		"commandId",
		"name",
		"source"
	], ["args"]),
	"compaction/end": disposition(["compactionId", "turn"], ["sourceCommandId", "error"]),
	"compaction/prune": disposition([
		"shadowedRange",
		"shadowedSeqs",
		"shadowedTokenCount"
	]),
	"compaction/start": disposition(["compactionId", "turn"], ["sourceCommandId"]),
	"compaction/summary": disposition([
		"compactionId",
		"summary",
		"shadowedRange",
		"shadowedSeqs",
		"shadowedTokenCount",
		"provider",
		"model"
	], [
		"sourceCommandId",
		"maxTokens",
		"usage",
		"rawOutput",
		"llmStreamCall"
	]),
	"feedback/record": disposition(["text"]),
	"goal/change": disposition([
		"kind",
		"version",
		"operation"
	], [
		"goal",
		"roundsStarted",
		"createdAt",
		"updatedAt",
		"cleared",
		"clearedAt"
	]),
	"hook/invoked": disposition([
		"turn",
		"point",
		"dialect",
		"handlerId"
	], ["matcher"]),
	"hook/result": disposition([
		"turn",
		"point",
		"handlerId",
		"decision",
		"durationMs"
	], ["exitCode", "stderrSummary"]),
	"llm/retry": disposition([
		"retryId",
		"turn",
		"step",
		"provider",
		"mode",
		"policyKey",
		"retry",
		"delayMs",
		"failure"
	], ["maxRetries"]),
	"llm/retry-started": disposition([
		"retryId",
		"turn",
		"step",
		"retry"
	]),
	"model/selection": disposition(["provider", "model"], ["reasoningEffort"]),
	"permission/preset": disposition(["preset"]),
	"plan/mode": disposition(["active"]),
	"request/context": disposition(["provider", "model"], ["contextWindow"]),
	"request/header": disposition(["header", "reason"], ["startsSeries"]),
	"sandbox/mode": disposition(["mode"], ["source"]),
	"schedule/change": disposition(["version", "operation"], [
		"schedule",
		"id",
		"acceptedAt"
	]),
	"session-log-deepseek/delivery-accepted": disposition(["sessionId", "throughSeq"]),
	"session/end-seed": disposition([]),
	"session/title": disposition([
		"title",
		"messageSeqs",
		"source"
	]),
	"session/title-llm-request": disposition([
		"titleProvider",
		"messageSeqs",
		"route",
		"system",
		"messages",
		"maxTokens"
	]),
	"step/end": disposition(["turn", "step"]),
	"step/start": disposition(["turn", "step"]),
	"subagent/descriptor": disposition([
		"mode",
		"version",
		"provider"
	], [
		"label",
		"agentProvider",
		"agentModel",
		"agentReasoningEffort",
		"persona",
		"toolFilter"
	]),
	"subagent/model-selection-policy": disposition(["allowedModels"]),
	"team/member": disposition([
		"version",
		"teamId",
		"member"
	]),
	"team/message/delivered": disposition([
		"version",
		"teamId",
		"messageId",
		"targetId"
	]),
	"team/message/queued": disposition([
		"version",
		"teamId",
		"message"
	]),
	"team/task": disposition([
		"version",
		"teamId",
		"task"
	]),
	"todo/write": disposition(["todos"]),
	"tool-workflow/agent-end": disposition([
		"runId",
		"seq",
		"outcome"
	]),
	"tool-workflow/agent-start": disposition([
		"runId",
		"seq",
		"label",
		"childId"
	], ["phase"]),
	"tool-workflow/run-end": disposition(["runId", "stopReason"]),
	"tool-workflow/run-start": disposition(["runId", "name"]),
	"tool/call": disposition([
		"turn",
		"step",
		"callId",
		"name",
		"arguments"
	]),
	"tool/code-dispatch": disposition([
		"rootCallId",
		"parentCallId",
		"subCallId",
		"name",
		"arguments",
		"isError",
		"content"
	], [], ["arguments"]),
	"tool/code-dispatch-start": disposition([
		"rootCallId",
		"parentCallId",
		"subCallId",
		"name",
		"arguments"
	], [], ["arguments"]),
	"tool/result": disposition([
		"turn",
		"step",
		"message"
	], ["error", "meta"], ["meta"]),
	"turn/end": disposition(["turn", "reason"]),
	"turn/start": disposition(["turn"]),
	"user/message": disposition([
		"role",
		"id",
		"content",
		"source"
	]),
	"web/deepseek-search-llm-request": disposition([
		"endpoint",
		"apiVersion",
		"body"
	])
});
/** Stable sorted released-v0 event inventory. */
const RELEASED_V0_EVENT_TYPES = Object.freeze(Object.keys(RELEASED_V0_EVENT_DISPOSITIONS).sort((left, right) => left.localeCompare(right, "en")));
//#endregion
//#region lib/types/validation-helpers.js
/**
* Require one plain JSON object.
* @param value - candidate JSON value.
* @param label - diagnostic subject.
* @returns validated object record.
*/
function releasedV0Record(value, label) {
	if (!isSessionFormatJsonObject(value)) throw new SessionFormatError(`${label} must be a JSON object`);
	return value;
}
/**
* Require every named member and no member outside the optional list.
* @param record - candidate object.
* @param required - members that must exist.
* @param optional - additional admitted members.
* @param label - diagnostic subject.
*/
function assertReleasedV0Keys(record, required, optional = [], label) {
	const allowed = new Set([...required, ...optional]);
	const unexpected = Object.keys(record).find((key) => !allowed.has(key));
	if (unexpected !== void 0) throw new SessionFormatError(`${label} has unexpected member ${JSON.stringify(unexpected)}`);
	const missing = required.find((key) => !Object.hasOwn(record, key));
	if (missing !== void 0) throw new SessionFormatError(`${label} lacks required member ${JSON.stringify(missing)}`);
}
//#endregion
//#region lib/types/payload-validation.js
/**
* Validate nested released payload semantics for one known event.
* @param event - known event with exact top-level members.
* @param version - source or current payload generation.
*/
function assertReleasedPayloadSemantics(event, version) {
	const data = releasedV0Record(event.data, `${event.type} ${event.seq} data`);
	const label = `${event.type} ${event.seq}`;
	switch (event.type) {
		case "agent-preset/selected":
			stringValue(data["agentPreset"], `${label} agentPreset`);
			return;
		case "agent/inbox/spliced":
			literalValue(data["target"], ["next-turn", "next-step"], `${label} target`);
			countValue(data["start"], `${label} start`);
			if (data["removedCount"] !== void 0) countValue(data["removedCount"], `${label} removedCount`);
			arrayValue(data["inserted"], `${label} inserted`, (value) => {
				messageValue(value, `${label} inserted message`, version, "user");
			});
			if (data["outcome"] !== void 0) literalValue(data["outcome"], ["canceled"], `${label} outcome`);
			return;
		case "approval/asked":
			nonEmptyString(data["id"], `${label} id`);
			nonEmptyString(data["toolName"], `${label} toolName`);
			if (data["callId"] !== void 0) nonEmptyString(data["callId"], `${label} callId`);
			if (data["reason"] !== void 0) stringValue(data["reason"], `${label} reason`);
			return;
		case "approval/decided":
			nonEmptyString(data["id"], `${label} id`);
			literalValue(data["outcome"], [
				"allowed-once",
				"rejected",
				"cancelled",
				"unavailable"
			], `${label} outcome`);
			return;
		case "approval/policy":
			literalValue(data["policy"], ["ask", "never"], `${label} policy`);
			if (data["source"] !== void 0) literalValue(data["source"], ["delegation"], `${label} source`);
			return;
		case "assistant/chunk":
			coordinatePair(data, label);
			streamChunkValue(data["chunk"], `${label} chunk`);
			return;
		case "assistant/message":
			coordinatePair(data, label);
			messageValue(data["message"], `${label} message`, version, "assistant");
			if (data["usage"] !== void 0) tokenUsageValue(data["usage"], `${label} usage`);
			if (data["interrupted"] !== void 0) literalValue(data["interrupted"], [true], `${label} interrupted`);
			return;
		case "command/done":
			nonEmptyString(data["commandId"], `${label} commandId`);
			literalValue(data["kind"], ["success", "error"], `${label} kind`);
			if (data["text"] !== void 0) stringValue(data["text"], `${label} text`);
			if (data["sourceEventSeq"] !== void 0) earlierSeq(data["sourceEventSeq"], event.seq, `${label} sourceEventSeq`);
			return;
		case "command/run":
			nonEmptyString(data["commandId"], `${label} commandId`);
			nonEmptyString(data["name"], `${label} name`);
			if (data["args"] !== void 0) stringValue(data["args"], `${label} args`);
			literalValue(exactRecord(data["source"], `${label} source`, ["kind"])["kind"], ["user"], `${label} source kind`);
			return;
		case "compaction/start":
		case "compaction/end":
			nonEmptyString(data["compactionId"], `${label} compactionId`);
			if (data["sourceCommandId"] !== void 0) nonEmptyString(data["sourceCommandId"], `${label} sourceCommandId`);
			nullableValue(data["turn"], `${label} turn`, countValue);
			if (data["error"] !== void 0) stringValue(data["error"], `${label} error`);
			return;
		case "compaction/prune":
			shadowedValue(data, event.seq, label);
			return;
		case "compaction/summary":
			if (data["llmStreamCall"] === true && data["rawOutput"] === void 0) throw new SessionFormatError(`${label} llmStreamCall requires rawOutput`);
			nonEmptyString(data["compactionId"], `${label} compactionId`);
			if (data["sourceCommandId"] !== void 0) nonEmptyString(data["sourceCommandId"], `${label} sourceCommandId`);
			contentBlocksValue(data["summary"], `${label} summary`, version);
			shadowedValue(data, event.seq, label);
			nonEmptyString(data["provider"], `${label} provider`);
			nonEmptyString(data["model"], `${label} model`);
			if (data["maxTokens"] !== void 0) countValue(data["maxTokens"], `${label} maxTokens`);
			if (data["usage"] !== void 0) tokenUsageValue(data["usage"], `${label} usage`);
			if (data["rawOutput"] !== void 0) contentBlocksValue(data["rawOutput"], `${label} rawOutput`, version);
			if (data["llmStreamCall"] !== void 0) literalValue(data["llmStreamCall"], [true], `${label} llmStreamCall`);
			return;
		case "feedback/record":
			nonEmptyString(data["text"], `${label} text`);
			return;
		case "goal/change":
			goalChangeValue(data, label);
			return;
		case "hook/invoked":
			countValue(data["turn"], `${label} turn`);
			nonEmptyString(data["point"], `${label} point`);
			literalValue(data["dialect"], ["claude-code", "codex"], `${label} dialect`);
			if (data["matcher"] !== void 0) stringValue(data["matcher"], `${label} matcher`);
			nonEmptyString(data["handlerId"], `${label} handlerId`);
			return;
		case "hook/result":
			countValue(data["turn"], `${label} turn`);
			nonEmptyString(data["point"], `${label} point`);
			nonEmptyString(data["handlerId"], `${label} handlerId`);
			nonEmptyString(data["decision"], `${label} decision`);
			if (data["exitCode"] !== void 0) safeIntegerValue(data["exitCode"], `${label} exitCode`);
			if (data["stderrSummary"] !== void 0) stringValue(data["stderrSummary"], `${label} stderrSummary`);
			if (finiteNumberValue(data["durationMs"], `${label} durationMs`) < 0) throw new SessionFormatError(`${label} durationMs must be non-negative`);
			return;
		case "llm/retry":
			nonEmptyString(data["retryId"], `${label} retryId`);
			coordinatePair(data, label);
			nonEmptyString(data["provider"], `${label} provider`);
			literalValue(data["mode"], ["normal", "always"], `${label} mode`);
			nonEmptyString(data["policyKey"], `${label} policyKey`);
			positiveIntegerValue(data["retry"], `${label} retry`);
			if (data["mode"] === "normal") {
				const maxRetries = positiveIntegerValue(data["maxRetries"], `${label} maxRetries`);
				if (data["retry"] > maxRetries) throw new SessionFormatError(`${label} retry exceeds maxRetries`);
			} else if (data["maxRetries"] !== void 0) throw new SessionFormatError(`${label} always mode must omit maxRetries`);
			const delayMs = finiteNumberValue(data["delayMs"], `${label} delayMs`);
			if (delayMs < 0) throw new SessionFormatError(`${label} delayMs must be non-negative`);
			if (delayMs > 2147483647) throw new SessionFormatError(`${label} delayMs exceeds the timer range`);
			llmFailureValue(data["failure"], `${label} failure`);
			return;
		case "llm/retry-started":
			nonEmptyString(data["retryId"], `${label} retryId`);
			coordinatePair(data, label);
			positiveIntegerValue(data["retry"], `${label} retry`);
			return;
		case "model/selection":
			nonEmptyString(data["provider"], `${label} provider`);
			nonEmptyString(data["model"], `${label} model`);
			if (data["reasoningEffort"] !== void 0) nonEmptyString(data["reasoningEffort"], `${label} reasoningEffort`);
			return;
		case "permission/preset":
			nonEmptyString(data["preset"], `${label} preset`);
			return;
		case "plan/mode":
			booleanValue(data["active"], `${label} active`);
			return;
		case "request/context":
			nonEmptyString(data["provider"], `${label} provider`);
			nonEmptyString(data["model"], `${label} model`);
			if (data["contextWindow"] !== void 0) positiveIntegerValue(data["contextWindow"], `${label} contextWindow`);
			return;
		case "request/header":
			requestHeaderValue(data["header"], `${label} header`);
			literalValue(data["reason"], [
				"initial",
				"resume",
				"change",
				"series"
			], `${label} reason`);
			if (data["startsSeries"] !== void 0) literalValue(data["startsSeries"], [true], `${label} startsSeries`);
			return;
		case "sandbox/mode":
			literalValue(data["mode"], [
				"read-only",
				"workspace-write",
				"danger-full-access"
			], `${label} mode`);
			if (data["source"] !== void 0) literalValue(data["source"], ["delegation"], `${label} source`);
			return;
		case "schedule/change":
			scheduleChangeValue(data, label);
			return;
		case "session-log-deepseek/delivery-accepted":
			if ((data["sessionFormatVersion"] === void 0 ? 0 : countValue(data["sessionFormatVersion"], `${label} sessionFormatVersion`)) !== version) return;
			nonEmptyString(data["sessionId"], `${label} sessionId`);
			earlierSeq(data["throughSeq"], event.seq, `${label} throughSeq`);
			return;
		case "session/end-seed": return;
		case "session/title":
			nonEmptyString(data["title"], `${label} title`);
			seqArray(data["messageSeqs"], event.seq, `${label} messageSeqs`, false);
			titleSourceValue(data["source"], `${label} source`);
			return;
		case "session/title-llm-request":
			nonEmptyString(data["titleProvider"], `${label} titleProvider`);
			seqArray(data["messageSeqs"], event.seq, `${label} messageSeqs`, true);
			modelRouteValue(data["route"], `${label} route`);
			stringValue(data["system"], `${label} system`);
			arrayValue(data["messages"], `${label} messages`, (value) => {
				messageValue(value, `${label} message`, version);
			});
			positiveIntegerValue(data["maxTokens"], `${label} maxTokens`);
			return;
		case "step/end":
		case "step/start":
			coordinatePair(data, label);
			return;
		case "subagent/descriptor":
			subagentDescriptorValue(data, label);
			return;
		case "subagent/model-selection-policy":
			allowedModelsValue(data["allowedModels"], `${label} allowedModels`);
			return;
		case "team/member":
			teamSelector(data, label);
			teamMemberValue(data["member"], `${label} member`);
			return;
		case "team/message/delivered":
			teamSelector(data, label);
			nonEmptyString(data["messageId"], `${label} messageId`);
			nonEmptyString(data["targetId"], `${label} targetId`);
			return;
		case "team/message/queued":
			teamSelector(data, label);
			teamMessageValue(data["message"], `${label} message`, version);
			return;
		case "team/task":
			teamSelector(data, label);
			teamTaskValue(data["task"], `${label} task`);
			return;
		case "todo/write":
			arrayValue(data["todos"], `${label} todos`, (value, itemLabel) => {
				const item = exactRecord(value, itemLabel, ["content", "status"]);
				stringValue(item["content"], `${itemLabel} content`);
				literalValue(item["status"], [
					"pending",
					"in_progress",
					"completed"
				], `${itemLabel} status`);
			});
			return;
		case "tool-workflow/agent-end":
			workflowIdentity(data, label);
			literalValue(data["outcome"], [
				"completed",
				"failed",
				"cancelled"
			], `${label} outcome`);
			return;
		case "tool-workflow/agent-start":
			workflowIdentity(data, label);
			stringValue(data["label"], `${label} label`);
			if (data["phase"] !== void 0) stringValue(data["phase"], `${label} phase`);
			nonEmptyString(data["childId"], `${label} childId`);
			return;
		case "tool-workflow/run-end":
			nonEmptyString(data["runId"], `${label} runId`);
			literalValue(data["stopReason"], [
				"completed",
				"cancelled",
				"error"
			], `${label} stopReason`);
			return;
		case "tool-workflow/run-start":
			nonEmptyString(data["runId"], `${label} runId`);
			nonEmptyString(data["name"], `${label} name`);
			return;
		case "tool/call":
			coordinatePair(data, label);
			nonEmptyString(data["callId"], `${label} callId`);
			nonEmptyString(data["name"], `${label} name`);
			stringValue(data["arguments"], `${label} arguments`);
			return;
		case "tool/code-dispatch":
		case "tool/code-dispatch-start":
			nonEmptyString(data["rootCallId"], `${label} rootCallId`);
			nonEmptyString(data["parentCallId"], `${label} parentCallId`);
			nonEmptyString(data["subCallId"], `${label} subCallId`);
			nonEmptyString(data["name"], `${label} name`);
			if (event.type === "tool/code-dispatch") {
				booleanValue(data["isError"], `${label} isError`);
				contentBlocksValue(data["content"], `${label} content`, version);
			}
			return;
		case "tool/result":
			coordinatePair(data, label);
			messageValue(data["message"], `${label} message`, version, "tool");
			if (data["error"] !== void 0) {
				const error = exactRecord(data["error"], `${label} error`, ["name", "code"]);
				nonEmptyString(error["name"], `${label} error name`);
				nonEmptyString(error["code"], `${label} error code`);
			}
			return;
		case "turn/end":
			countValue(data["turn"], `${label} turn`);
			turnEndReasonValue(data["reason"], `${label} reason`);
			return;
		case "turn/start":
			countValue(data["turn"], `${label} turn`);
			return;
		case "user/message":
			messageValue(data, label, version, "user");
			return;
		case "web/deepseek-search-llm-request":
			nonEmptyString(data["endpoint"], `${label} endpoint`);
			nonEmptyString(data["apiVersion"], `${label} apiVersion`);
			deepSeekSearchBodyValue(data["body"], `${label} body`);
			return;
		/* v8 ignore next -- the frozen disposition rejects unknown types before semantic dispatch. */
		default: throw new SessionFormatError(`released payload validator is missing event ${JSON.stringify(event.type)}`);
	}
}
function exactRecord(value, label, required, optional = []) {
	const record = releasedV0Record(value, label);
	assertReleasedV0Keys(record, required, optional, label);
	return record;
}
function stringValue(value, label) {
	if (typeof value !== "string") throw new SessionFormatError(`${label} must be a string`);
}
function nonEmptyString(value, label) {
	if (typeof value !== "string" || value.length === 0) throw new SessionFormatError(`${label} must be a non-empty string`);
}
function booleanValue(value, label) {
	if (typeof value !== "boolean") throw new SessionFormatError(`${label} must be a boolean`);
}
function safeIntegerValue(value, label) {
	return sessionFormatSafeInteger(value, label);
}
function countValue(value, label) {
	return sessionFormatCount(value, label);
}
function positiveIntegerValue(value, label) {
	const result = countValue(value, label);
	if (result === 0) throw new SessionFormatError(`${label} must be positive`);
	return result;
}
function finiteNumberValue(value, label) {
	if (typeof value !== "number" || !Number.isFinite(value) || Object.is(value, -0)) throw new SessionFormatError(`${label} must be a finite number`);
	return value;
}
function literalValue(value, allowed, label) {
	if (!allowed.some((candidate) => candidate === value)) throw new SessionFormatError(`${label} must be one of ${allowed.map(String).join(", ")}`);
}
function nullableValue(value, label, validate) {
	if (value !== null) validate(value, label);
}
function arrayValue(value, label, validate) {
	if (!Array.isArray(value)) throw new SessionFormatError(`${label} must be an array`);
	const members = value;
	members.forEach((member, index) => {
		validate(member, `${label}[${index}]`);
	});
	return members;
}
function coordinatePair(data, label) {
	countValue(data["turn"], `${label} turn`);
	countValue(data["step"], `${label} step`);
}
function earlierSeq(value, eventSeq, label) {
	const seq = countValue(value, label);
	if (seq >= eventSeq) throw new SessionFormatError(`${label} must identify an earlier event`);
	return seq;
}
function seqArray(value, eventSeq, label, requireNonEmpty) {
	const seen = /* @__PURE__ */ new Set();
	const values = arrayValue(value, label, (member, memberLabel) => {
		const seq = earlierSeq(member, eventSeq, memberLabel);
		if (seen.has(seq)) throw new SessionFormatError(`${label} repeats seq ${seq}`);
		seen.add(seq);
	});
	if (requireNonEmpty && values.length === 0) throw new SessionFormatError(`${label} must be non-empty`);
	return values;
}
function llmFailureValue(value, label) {
	const failure = exactRecord(value, label, ["message", "code"], [
		"status",
		"providerRetryAfterMs",
		"requestId"
	]);
	nonEmptyString(failure["message"], `${label} message`);
	nonEmptyString(failure["code"], `${label} code`);
	if (failure["status"] !== void 0) {
		const status = safeIntegerValue(failure["status"], `${label} status`);
		if (status < 100 || status > 599) throw new SessionFormatError(`${label} status must be 100 through 599`);
	}
	if (failure["providerRetryAfterMs"] !== void 0 && finiteNumberValue(failure["providerRetryAfterMs"], `${label} providerRetryAfterMs`) <= 0) throw new SessionFormatError(`${label} providerRetryAfterMs must be positive`);
	if (failure["requestId"] !== void 0) nonEmptyString(failure["requestId"], `${label} requestId`);
}
function tokenUsageValue(value, label) {
	const usage = exactRecord(value, label, ["inputTokens", "outputTokens"], [
		"totalTokens",
		"cacheReadTokens",
		"cacheWriteTokens",
		"reasoningTokens"
	]);
	for (const key of Object.keys(usage)) countValue(usage[key], `${label} ${key}`);
}
function contentBlocksValue(value, label, version) {
	arrayValue(value, label, (member, memberLabel) => {
		contentBlockValue(member, memberLabel, version);
	});
}
function contentBlockValue(value, label, version) {
	const block = releasedV0Record(value, label);
	switch (block["type"]) {
		case "text":
		case "reasoning":
			assertReleasedV0Keys(block, ["type", "text"], [], label);
			stringValue(block["text"], `${label} text`);
			return;
		case "image":
			assertReleasedV0Keys(block, ["type", "attachment"], [], label);
			imageAttachmentValue(block["attachment"], `${label} attachment`);
			return;
		case "tool-call":
			assertReleasedV0Keys(block, [
				"type",
				"id",
				"name",
				"arguments"
			], [], label);
			nonEmptyString(block["id"], `${label} id`);
			nonEmptyString(block["name"], `${label} name`);
			stringValue(block["arguments"], `${label} arguments`);
			return;
		case "tool-result":
			assertReleasedV0Keys(block, [
				"type",
				"toolCallId",
				"content"
			], ["isError"], label);
			nonEmptyString(block["toolCallId"], `${label} toolCallId`);
			contentBlocksValue(block["content"], `${label} content`, version);
			if (block["isError"] !== void 0) booleanValue(block["isError"], `${label} isError`);
			return;
		default:
			nonEmptyString(block["type"], `${label} type`);
			return;
	}
}
function imageAttachmentValue(value, label) {
	const attachment = exactRecord(value, label, [
		"attachmentId",
		"mediaType",
		"bytes",
		"width",
		"height"
	], ["name", "originalDimensions"]);
	nonEmptyString(attachment["attachmentId"], `${label} attachmentId`);
	literalValue(attachment["mediaType"], [
		"image/png",
		"image/jpeg",
		"image/webp",
		"image/gif"
	], `${label} mediaType`);
	countValue(attachment["bytes"], `${label} bytes`);
	positiveIntegerValue(attachment["width"], `${label} width`);
	positiveIntegerValue(attachment["height"], `${label} height`);
	if (attachment["name"] !== void 0) stringValue(attachment["name"], `${label} name`);
	if (attachment["originalDimensions"] !== void 0) {
		const dimensions = exactRecord(attachment["originalDimensions"], `${label} originalDimensions`, ["width", "height"]);
		positiveIntegerValue(dimensions["width"], `${label} original width`);
		positiveIntegerValue(dimensions["height"], `${label} original height`);
	}
}
function messageValue(value, label, version, expected) {
	const message = exactRecord(value, label, [
		"id",
		"role",
		"content",
		"source"
	]);
	nonEmptyString(message["id"], `${label} id`);
	const role = expected === "assistant" ? "assistant" : expected === "user" || expected === "tool" ? "user" : void 0;
	if (role === void 0) literalValue(message["role"], [
		"system",
		"user",
		"assistant"
	], `${label} role`);
	else literalValue(message["role"], [role], `${label} role`);
	contentBlocksValue(message["content"], `${label} content`, version);
	const source = releasedV0Record(message["source"], `${label} source`);
	if (version < 2 && expected === "user" && source["kind"] === "goal" && source["change"] !== void 0) legacyGoalMessageValue(message, source, label);
	else messageSourceValue(source, `${label} source`, version, expected);
	if (expected === "tool") {
		const content = message["content"];
		const block = Array.isArray(content) && content.length === 1 ? releasedV0Record(content[0], `${label} tool result`) : void 0;
		const source = releasedV0Record(message["source"], `${label} source`);
		if (block?.["type"] !== "tool-result" || block["toolCallId"] !== source["callId"]) throw new SessionFormatError(`${label} must contain exactly one tool-result block`);
	}
}
function legacyGoalMessageValue(message, source, label) {
	assertReleasedV0Keys(source, [
		"kind",
		"goalId",
		"revision",
		"round",
		"change"
	], [], `${label} source`);
	nonEmptyString(source["goalId"], `${label} source goalId`);
	positiveIntegerValue(source["revision"], `${label} source revision`);
	if (source["round"] !== 0) throw new SessionFormatError(`${label} legacy goal source round must be 0`);
	const change = releasedV0Record(source["change"], `${label} source change`);
	goalChangeValue(change, `${label} source change`);
	const ref = releasedV0Record(change["operation"] === "clear" ? change["cleared"] : change["goal"], `${label} source change ref`);
	if (source["goalId"] !== ref["id"] || source["revision"] !== ref["revision"]) throw new SessionFormatError(`${label} legacy goal source does not match its change`);
	const payload = change["operation"] === "clear" ? {
		cleared: change["cleared"],
		clearedAt: change["clearedAt"]
	} : {
		goal: change["goal"],
		roundsStarted: change["roundsStarted"],
		createdAt: change["createdAt"],
		updatedAt: change["updatedAt"]
	};
	const expected = [{
		type: "text",
		text: `<goal_state>${JSON.stringify(payload)}</goal_state>`
	}];
	if (!deepEqualJson(message["content"], expected)) throw new SessionFormatError(`${label} legacy goal content does not match its change`);
}
function messageSourceValue(value, label, version, expected) {
	const source = releasedV0Record(value, label);
	if (expected === "assistant" && source["kind"] !== "model") throw new SessionFormatError(`${label} must be model source`);
	if (expected === "tool" && source["kind"] !== "tool") throw new SessionFormatError(`${label} must be tool source`);
	switch (source["kind"]) {
		case "user":
			assertReleasedV0Keys(source, ["kind"], ["rpcId", "clientTimeZone"], label);
			if (source["rpcId"] !== void 0) nonEmptyString(source["rpcId"], `${label} rpcId`);
			if (source["clientTimeZone"] !== void 0) nonEmptyString(source["clientTimeZone"], `${label} clientTimeZone`);
			return;
		case "plugin":
			pluginSourceValue(source, label);
			return;
		case "model":
			assertReleasedV0Keys(source, [
				"kind",
				"provider",
				"model"
			], ["replayState"], label);
			nonEmptyString(source["provider"], `${label} provider`);
			nonEmptyString(source["model"], `${label} model`);
			return;
		case "tool":
			assertReleasedV0Keys(source, ["kind", "callId"], [], label);
			nonEmptyString(source["callId"], `${label} callId`);
			return;
		case "agent-instructions":
			assertReleasedV0Keys(source, [
				"kind",
				"form",
				"changes"
			], ["baseline", "baselineIdentity"], label);
			literalValue(source["form"], ["instructions"], `${label} form`);
			if (source["baseline"] !== void 0) literalValue(source["baseline"], [true], `${label} baseline`);
			if (source["baselineIdentity"] !== void 0) nonEmptyString(source["baselineIdentity"], `${label} baselineIdentity`);
			arrayValue(source["changes"], `${label} changes`, (member, memberLabel) => {
				const change = exactRecord(member, memberLabel, [
					"action",
					"scope",
					"path"
				], ["digest"]);
				literalValue(change["action"], [
					"set",
					"replace",
					"remove"
				], `${memberLabel} action`);
				stringValue(change["scope"], `${memberLabel} scope`);
				stringValue(change["path"], `${memberLabel} path`);
				if (change["digest"] !== void 0) stringValue(change["digest"], `${memberLabel} digest`);
			});
			return;
		case "session-reference":
			sessionReferenceSourceValue(source, label, version);
			return;
		case "team-message":
			assertReleasedV0Keys(source, [
				"kind",
				"teamId",
				"messageId",
				"senderId",
				"senderName"
			], [], label);
			for (const key of [
				"teamId",
				"messageId",
				"senderId"
			]) nonEmptyString(source[key], `${label} ${key}`);
			stringValue(source["senderName"], `${label} senderName`);
			return;
		case "goal":
			assertReleasedV0Keys(source, [
				"kind",
				"goalId",
				"revision",
				"round"
			], [], label);
			nonEmptyString(source["goalId"], `${label} goalId`);
			positiveIntegerValue(source["revision"], `${label} revision`);
			positiveIntegerValue(source["round"], `${label} round`);
			return;
		case "skill-invocation":
			assertReleasedV0Keys(source, [
				"kind",
				"name",
				"form"
			], [], label);
			nonEmptyString(source["name"], `${label} name`);
			literalValue(source["form"], ["instructions"], `${label} form`);
			return;
		case "skill-catalog":
			assertReleasedV0Keys(source, [
				"kind",
				"form",
				"entries"
			], ["update"], label);
			literalValue(source["form"], ["catalog"], `${label} form`);
			if (source["update"] !== void 0) literalValue(source["update"], [true], `${label} update`);
			arrayValue(source["entries"], `${label} entries`, (member, memberLabel) => {
				const entry = exactRecord(member, memberLabel, ["name", "description"]);
				nonEmptyString(entry["name"], `${memberLabel} name`);
				stringValue(entry["description"], `${memberLabel} description`);
			});
			return;
		case "coordinator":
		case "subagent-report":
			assertReleasedV0Keys(source, [
				"kind",
				"form",
				"senderSessionId"
			], [], label);
			literalValue(source["form"], ["relay"], `${label} form`);
			nonEmptyString(source["senderSessionId"], `${label} senderSessionId`);
			return;
		case "subagent-settled":
			assertReleasedV0Keys(source, [
				"kind",
				"form",
				"summary",
				"senderSessionId"
			], [], label);
			literalValue(source["form"], ["notice"], `${label} form`);
			stringValue(source["summary"], `${label} summary`);
			nonEmptyString(source["senderSessionId"], `${label} senderSessionId`);
			return;
		case "webhook":
			assertReleasedV0Keys(source, [
				"kind",
				"provider",
				"source",
				"deliveryId",
				"ruleId",
				"form",
				"summary"
			], [], label);
			for (const key of [
				"provider",
				"source",
				"deliveryId",
				"ruleId"
			]) nonEmptyString(source[key], `${label} ${key}`);
			literalValue(source["form"], ["notice"], `${label} form`);
			stringValue(source["summary"], `${label} summary`);
			return;
		default:
			nonEmptyString(source["kind"], `${label} kind`);
			return;
	}
}
function pluginSourceValue(source, label) {
	const optional = [
		"form",
		"sections",
		"summary"
	];
	if (source["plugin"] === "compact") optional.push("compactionId", "sourceCommandId");
	assertReleasedV0Keys(source, ["kind", "plugin"], optional, label);
	nonEmptyString(source["plugin"], `${label} plugin`);
	if (source["plugin"] === "compact") {
		nonEmptyString(source["compactionId"], `${label} compactionId`);
		if (source["sourceCommandId"] !== void 0) nonEmptyString(source["sourceCommandId"], `${label} sourceCommandId`);
	}
	const form = source["form"];
	if (form === void 0) return;
	literalValue(form, [
		"instructions",
		"catalog",
		"snapshot",
		"notice",
		"relay",
		"recall"
	], `${label} form`);
	if (form === "snapshot") arrayValue(source["sections"], `${label} sections`, (member, memberLabel) => {
		const section = exactRecord(member, memberLabel, ["name", "text"]);
		nonEmptyString(section["name"], `${memberLabel} name`);
		stringValue(section["text"], `${memberLabel} text`);
	});
	else if (source["sections"] !== void 0) throw new SessionFormatError(`${label} sections require snapshot form`);
	if (form === "notice") stringValue(source["summary"], `${label} summary`);
	else if (source["summary"] !== void 0) throw new SessionFormatError(`${label} summary requires notice form`);
}
function sessionReferenceSourceValue(source, label, version) {
	assertReleasedV0Keys(source, [
		"kind",
		"form",
		"version",
		"references"
	], [], label);
	literalValue(source["form"], ["recall"], `${label} form`);
	literalValue(source["version"], [1], `${label} version`);
	let expectedInputIndex = 0;
	const sessionIds = /* @__PURE__ */ new Set();
	if (arrayValue(source["references"], `${label} references`, (member, memberLabel) => {
		const reference = exactRecord(member, memberLabel, [
			"sessionId",
			"label",
			"capturedThroughSeq",
			"compacted",
			"originalMessages",
			"retainedMessages",
			"omittedMessages",
			"omittedBytes",
			"truncated",
			"inputIndex"
		], version >= 1 ? ["capturedFormatVersion"] : []);
		nonEmptyString(reference["sessionId"], `${memberLabel} sessionId`);
		stringValue(reference["label"], `${memberLabel} label`);
		if (reference["capturedThroughSeq"] !== null) countValue(reference["capturedThroughSeq"], `${memberLabel} capturedThroughSeq`);
		if (reference["capturedFormatVersion"] !== void 0) {
			const capturedVersion = countValue(reference["capturedFormatVersion"], `${memberLabel} capturedFormatVersion`);
			if (capturedVersion < 1 || capturedVersion > version) throw new SessionFormatError(`${memberLabel} capturedFormatVersion must be between 1 and ${version}`);
		}
		booleanValue(reference["compacted"], `${memberLabel} compacted`);
		const original = countValue(reference["originalMessages"], `${memberLabel} originalMessages`);
		const retained = countValue(reference["retainedMessages"], `${memberLabel} retainedMessages`);
		const omitted = countValue(reference["omittedMessages"], `${memberLabel} omittedMessages`);
		const omittedBytes = countValue(reference["omittedBytes"], `${memberLabel} omittedBytes`);
		const inputIndex = countValue(reference["inputIndex"], `${memberLabel} inputIndex`);
		const truncated = reference["truncated"];
		booleanValue(truncated, `${memberLabel} truncated`);
		if (retained > original || omitted !== original - retained) throw new SessionFormatError(`${memberLabel} message counts are inconsistent`);
		if (truncated !== (omitted > 0 || omittedBytes > 0)) throw new SessionFormatError(`${memberLabel} truncated disagrees with omitted content`);
		if (inputIndex !== expectedInputIndex) throw new SessionFormatError(`${label} inputIndex must match reference position`);
		expectedInputIndex += 1;
		const sessionId = reference["sessionId"];
		if (sessionIds.has(sessionId)) throw new SessionFormatError(`${label} repeats sessionId ${sessionId}`);
		sessionIds.add(sessionId);
	}).length === 0) throw new SessionFormatError(`${label} references must be non-empty`);
}
function streamChunkValue(value, label) {
	const chunk = releasedV0Record(value, label);
	switch (chunk["type"]) {
		case "block-start":
			assertReleasedV0Keys(chunk, [
				"type",
				"index",
				"blockType"
			], [], label);
			countValue(chunk["index"], `${label} index`);
			nonEmptyString(chunk["blockType"], `${label} blockType`);
			return;
		case "text-delta":
		case "reasoning-delta":
			assertReleasedV0Keys(chunk, [
				"type",
				"index",
				"text"
			], [], label);
			countValue(chunk["index"], `${label} index`);
			stringValue(chunk["text"], `${label} text`);
			return;
		case "tool-call-delta":
			assertReleasedV0Keys(chunk, [
				"type",
				"index",
				"id",
				"argumentsDelta"
			], ["name"], label);
			countValue(chunk["index"], `${label} index`);
			nonEmptyString(chunk["id"], `${label} id`);
			if (chunk["name"] !== void 0) stringValue(chunk["name"], `${label} name`);
			stringValue(chunk["argumentsDelta"], `${label} argumentsDelta`);
			return;
		case "block-end":
			assertReleasedV0Keys(chunk, [
				"type",
				"index",
				"block"
			], [], label);
			countValue(chunk["index"], `${label} index`);
			contentBlockValue(chunk["block"], `${label} block`, 1);
			return;
		case "usage":
			assertReleasedV0Keys(chunk, ["type", "usage"], [], label);
			tokenUsageValue(chunk["usage"], `${label} usage`);
			return;
		case "finish":
			assertReleasedV0Keys(chunk, ["type", "reason"], ["replayState"], label);
			finishReasonValue(chunk["reason"], `${label} reason`);
			if (chunk["replayState"] !== void 0) replayEnvelopeValue(chunk["replayState"], `${label} replayState`);
			return;
		default: throw new SessionFormatError(`${label} has unknown stream chunk type ${JSON.stringify(chunk["type"])}`);
	}
}
function finishReasonValue(value, label) {
	const reason = releasedV0Record(value, label);
	if (reason["kind"] === "aborted" || reason["kind"] === "error") {
		assertReleasedV0Keys(reason, ["kind", "failure"], [], label);
		llmFailureValue(reason["failure"], `${label} failure`);
		return;
	}
	if (reason["kind"] === "stop" || reason["kind"] === "tool-calls" || reason["kind"] === "max-tokens") assertReleasedV0Keys(reason, ["kind"], [], label);
	nonEmptyString(reason["kind"], `${label} kind`);
}
function replayEnvelopeValue(value, label) {
	const replay = exactRecord(value, label, ["response"], ["blocks"]);
	if (replay["blocks"] !== void 0 && !Array.isArray(replay["blocks"])) throw new SessionFormatError(`${label} blocks must be an array`);
}
function turnEndReasonValue(value, label) {
	const reason = releasedV0Record(value, label);
	switch (reason["kind"]) {
		case "completed":
		case "blocked":
		case "max-tokens":
		case "interrupted":
			assertReleasedV0Keys(reason, ["kind"], [], label);
			return;
		case "aborted": {
			assertReleasedV0Keys(reason, ["kind", "reason"], [], label);
			const cause = releasedV0Record(reason["reason"], `${label} abort cause`);
			if (cause["kind"] === "hook") {
				assertReleasedV0Keys(cause, ["kind", "reason"], [], `${label} abort cause`);
				stringValue(cause["reason"], `${label} abort reason`);
			} else {
				assertReleasedV0Keys(cause, ["kind"], [], `${label} abort cause`);
				literalValue(cause["kind"], [
					"user",
					"parent",
					"disposed",
					"legacy"
				], `${label} abort kind`);
			}
			return;
		}
		case "error":
			assertReleasedV0Keys(reason, ["kind", "error"], [], label);
			llmFailureValue(reason["error"], `${label} error`);
			return;
		default:
			nonEmptyString(reason["kind"], `${label} kind`);
			return;
	}
}
function requestHeaderValue(value, label) {
	const header = exactRecord(value, label, ["config"], [
		"adapterDefaults",
		"system",
		"tools"
	]);
	const config = exactRecord(header["config"], `${label} config`, ["provider", "model"], [
		"reasoningEffort",
		"temperature",
		"maxTokens",
		"stop"
	]);
	nonEmptyString(config["provider"], `${label} provider`);
	nonEmptyString(config["model"], `${label} model`);
	if (config["reasoningEffort"] !== void 0) nonEmptyString(config["reasoningEffort"], `${label} reasoningEffort`);
	if (config["temperature"] !== void 0) finiteNumberValue(config["temperature"], `${label} temperature`);
	if (config["maxTokens"] !== void 0) positiveIntegerValue(config["maxTokens"], `${label} maxTokens`);
	if (config["stop"] !== void 0) arrayValue(config["stop"], `${label} stop`, stringValue);
	if (header["adapterDefaults"] !== void 0) {
		const defaults = exactRecord(header["adapterDefaults"], `${label} adapterDefaults`, [], ["reasoningEffort", "maxTokens"]);
		for (const [key, marker] of Object.entries(defaults)) {
			literalValue(marker, [true], `${label} adapterDefaults ${key}`);
			if (!Object.hasOwn(config, key)) throw new SessionFormatError(`${label} adapter default ${key} lacks config value`);
		}
	}
	if (header["system"] !== void 0) stringValue(header["system"], `${label} system`);
	if (header["tools"] !== void 0) arrayValue(header["tools"], `${label} tools`, toolSchemaValue);
}
function toolSchemaValue(value, label) {
	const schema = exactRecord(value, label, [
		"name",
		"description",
		"parameters"
	]);
	nonEmptyString(schema["name"], `${label} name`);
	stringValue(schema["description"], `${label} description`);
	releasedV0Record(schema["parameters"], `${label} parameters`);
}
function shadowedValue(data, eventSeq, label) {
	const range = exactRecord(data["shadowedRange"], `${label} shadowedRange`, ["start", "end"]);
	const start = earlierSeq(range["start"], eventSeq, `${label} shadowedRange start`);
	const end = earlierSeq(range["end"], eventSeq, `${label} shadowedRange end`);
	const seqs = seqArray(data["shadowedSeqs"], eventSeq, `${label} shadowedSeqs`, true);
	if (seqs[0] !== start || seqs.at(-1) !== end) throw new SessionFormatError(`${label} shadowedRange must match shadowedSeqs endpoints`);
	countValue(data["shadowedTokenCount"], `${label} shadowedTokenCount`);
}
function goalChangeValue(data, label) {
	literalValue(data["kind"], ["goal/change"], `${label} kind`);
	literalValue(data["version"], [1], `${label} version`);
	if (data["operation"] === "clear") {
		assertReleasedV0Keys(data, [
			"kind",
			"version",
			"operation",
			"cleared",
			"clearedAt"
		], [], `${label} data`);
		goalRefValue(data["cleared"], `${label} cleared`);
		countValue(data["clearedAt"], `${label} clearedAt`);
		return;
	}
	assertReleasedV0Keys(data, [
		"kind",
		"version",
		"operation",
		"goal",
		"roundsStarted",
		"createdAt",
		"updatedAt"
	], [], `${label} data`);
	literalValue(data["operation"], [
		"create",
		"edit",
		"pause",
		"resume",
		"complete",
		"block"
	], `${label} operation`);
	goalSnapshotValue(data["goal"], `${label} goal`);
	countValue(data["roundsStarted"], `${label} roundsStarted`);
	countValue(data["createdAt"], `${label} createdAt`);
	countValue(data["updatedAt"], `${label} updatedAt`);
}
function goalRefValue(value, label) {
	const ref = exactRecord(value, label, ["id", "revision"]);
	nonEmptyString(ref["id"], `${label} id`);
	positiveIntegerValue(ref["revision"], `${label} revision`);
}
function goalSnapshotValue(value, label) {
	const goal = exactRecord(value, label, [
		"id",
		"revision",
		"objective",
		"phase",
		"maxGoalRounds"
	], ["blockedReason"]);
	nonEmptyString(goal["id"], `${label} id`);
	positiveIntegerValue(goal["revision"], `${label} revision`);
	nonEmptyString(goal["objective"], `${label} objective`);
	literalValue(goal["phase"], [
		"active",
		"paused",
		"blocked",
		"complete"
	], `${label} phase`);
	positiveIntegerValue(goal["maxGoalRounds"], `${label} maxGoalRounds`);
	if (goal["phase"] === "blocked") {
		const reason = exactRecord(goal["blockedReason"], `${label} blockedReason`, ["code", "message"]);
		nonEmptyString(reason["code"], `${label} blocked code`);
		nonEmptyString(reason["message"], `${label} blocked message`);
	} else if (goal["blockedReason"] !== void 0) throw new SessionFormatError(`${label} blockedReason requires blocked phase`);
}
function scheduleChangeValue(data, label) {
	literalValue(data["version"], [1], `${label} version`);
	if (data["operation"] === "create") {
		assertReleasedV0Keys(data, [
			"version",
			"operation",
			"schedule"
		], [], `${label} data`);
		scheduleRecordValue(data["schedule"], `${label} schedule`);
		return;
	}
	assertReleasedV0Keys(data, [
		"version",
		"operation",
		"id"
	], data["operation"] === "dispatch" ? ["acceptedAt"] : [], `${label} data`);
	literalValue(data["operation"], ["delete", "dispatch"], `${label} operation`);
	scheduleIdValue(data["id"], `${label} id`);
	if (data["acceptedAt"] !== void 0) instantValue(data["acceptedAt"], `${label} acceptedAt`);
}
function scheduleRecordValue(value, label) {
	const record = releasedV0Record(value, label);
	if (record["kind"] === "after") {
		assertReleasedV0Keys(record, [
			"id",
			"kind",
			"prompt",
			"afterSeconds",
			"scheduledAt"
		], [], label);
		positiveIntegerValue(record["afterSeconds"], `${label} afterSeconds`);
	} else if (record["kind"] === "at") assertReleasedV0Keys(record, [
		"id",
		"kind",
		"prompt",
		"scheduledAt"
	], [], label);
	else if (record["kind"] === "every") {
		assertReleasedV0Keys(record, [
			"id",
			"kind",
			"prompt",
			"everySeconds",
			"scheduledAt"
		], [], label);
		if (positiveIntegerValue(record["everySeconds"], `${label} everySeconds`) < 300) throw new SessionFormatError(`${label} everySeconds must be at least 300`);
	} else throw new SessionFormatError(`${label} has unknown schedule kind`);
	scheduleIdValue(record["id"], `${label} id`);
	nonEmptyString(record["prompt"], `${label} prompt`);
	instantValue(record["scheduledAt"], `${label} scheduledAt`);
}
function scheduleIdValue(value, label) {
	nonEmptyString(value, label);
	if (value.trim() !== value) throw new SessionFormatError(`${label} must not have surrounding whitespace`);
}
function instantValue(value, label) {
	if (typeof value !== "string" || !/^(?!0000)\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/u.test(value) || !Number.isFinite(Date.parse(value)) || new Date(Date.parse(value)).toISOString() !== value) throw new SessionFormatError(`${label} must be a canonical UTC instant`);
}
function titleSourceValue(value, label) {
	const source = releasedV0Record(value, label);
	if (source["kind"] === "provider") {
		assertReleasedV0Keys(source, ["kind", "provider"], ["model"], label);
		nonEmptyString(source["provider"], `${label} provider`);
		if (source["model"] !== void 0) modelRouteValue(source["model"], `${label} model`);
		return;
	}
	assertReleasedV0Keys(source, ["kind"], [], label);
	literalValue(source["kind"], ["fallback", "user"], `${label} kind`);
}
function modelRouteValue(value, label) {
	const route = exactRecord(value, label, ["provider", "model"]);
	nonEmptyString(route["provider"], `${label} provider`);
	nonEmptyString(route["model"], `${label} model`);
}
function subagentDescriptorValue(data, label) {
	literalValue(data["version"], [3], `${label} version`);
	nonEmptyString(data["provider"], `${label} provider`);
	if (data["mode"] === "one-shot") {
		assertReleasedV0Keys(data, [
			"mode",
			"version",
			"provider"
		], ["label"], `${label} data`);
		if (data["label"] !== void 0) stringValue(data["label"], `${label} label`);
		return;
	}
	literalValue(data["mode"], ["continuable"], `${label} mode`);
	nonEmptyString(data["label"], `${label} label`);
	for (const key of [
		"agentProvider",
		"agentModel",
		"agentReasoningEffort",
		"persona"
	]) if (data[key] !== void 0) nonEmptyString(data[key], `${label} ${key}`);
	if (data["agentProvider"] === void 0 !== (data["agentModel"] === void 0)) throw new SessionFormatError(`${label} agentProvider and agentModel must be paired`);
	if (data["toolFilter"] !== void 0) {
		const filter = exactRecord(data["toolFilter"], `${label} toolFilter`, [], ["allow", "deny"]);
		if (filter["allow"] === void 0 && filter["deny"] === void 0) throw new SessionFormatError(`${label} toolFilter requires allow or deny`);
		if (filter["allow"] !== void 0) arrayValue(filter["allow"], `${label} allow`, nonEmptyString);
		if (filter["deny"] !== void 0) arrayValue(filter["deny"], `${label} deny`, nonEmptyString);
	}
}
function allowedModelsValue(value, label) {
	const seen = /* @__PURE__ */ new Set();
	if (arrayValue(value, label, (member, memberLabel) => {
		const route = exactRecord(member, memberLabel, ["provider", "model"]);
		nonEmptyString(route["provider"], `${memberLabel} provider`);
		nonEmptyString(route["model"], `${memberLabel} model`);
		const key = `${route["provider"]}\0${route["model"]}`;
		if (seen.has(key)) throw new SessionFormatError(`${label} repeats route ${key}`);
		seen.add(key);
	}).length === 0) throw new SessionFormatError(`${label} must be non-empty`);
}
function teamSelector(data, label) {
	literalValue(data["version"], [1], `${label} version`);
	nonEmptyString(data["teamId"], `${label} teamId`);
}
function teamMemberValue(value, label) {
	const member = exactRecord(value, label, [
		"id",
		"name",
		"description",
		"provider",
		"context",
		"phase"
	], ["error"]);
	nonEmptyString(member["id"], `${label} id`);
	stringValue(member["name"], `${label} name`);
	stringValue(member["description"], `${label} description`);
	stringValue(member["provider"], `${label} provider`);
	literalValue(member["context"], ["fresh", "fork"], `${label} context`);
	literalValue(member["phase"], [
		"provisioning",
		"active",
		"failed"
	], `${label} phase`);
	if (member["error"] !== void 0) stringValue(member["error"], `${label} error`);
}
function teamTaskValue(value, label) {
	const task = exactRecord(value, label, [
		"id",
		"revision",
		"subject",
		"description",
		"status",
		"blockedBy",
		"writeScopes"
	], ["ownerId"]);
	nonEmptyString(task["id"], `${label} id`);
	positiveIntegerValue(task["revision"], `${label} revision`);
	stringValue(task["subject"], `${label} subject`);
	stringValue(task["description"], `${label} description`);
	literalValue(task["status"], [
		"pending",
		"in_progress",
		"completed",
		"deleted"
	], `${label} status`);
	if (task["ownerId"] !== void 0) nonEmptyString(task["ownerId"], `${label} ownerId`);
	arrayValue(task["blockedBy"], `${label} blockedBy`, nonEmptyString);
	arrayValue(task["writeScopes"], `${label} writeScopes`, stringValue);
}
function teamMessageValue(value, label, version) {
	const message = exactRecord(value, label, [
		"id",
		"senderId",
		"senderName",
		"targetId",
		"delivery",
		"content"
	]);
	for (const key of [
		"id",
		"senderId",
		"targetId"
	]) nonEmptyString(message[key], `${label} ${key}`);
	stringValue(message["senderName"], `${label} senderName`);
	literalValue(message["delivery"], ["quiet", "wakeup"], `${label} delivery`);
	contentBlocksValue(message["content"], `${label} content`, version);
}
function workflowIdentity(data, label) {
	nonEmptyString(data["runId"], `${label} runId`);
	positiveIntegerValue(data["seq"], `${label} seq`);
}
function deepSeekSearchBodyValue(value, label) {
	const body = exactRecord(value, label, [
		"model",
		"max_tokens",
		"messages",
		"tools"
	]);
	nonEmptyString(body["model"], `${label} model`);
	positiveIntegerValue(body["max_tokens"], `${label} max_tokens`);
	if (arrayValue(body["messages"], `${label} messages`, (member, memberLabel) => {
		const message = exactRecord(member, memberLabel, ["role", "content"]);
		literalValue(message["role"], ["user"], `${memberLabel} role`);
		if (arrayValue(message["content"], `${memberLabel} content`, (block, blockLabel) => {
			const text = exactRecord(block, blockLabel, ["type", "text"]);
			literalValue(text["type"], ["text"], `${blockLabel} type`);
			stringValue(text["text"], `${blockLabel} text`);
		}).length !== 1) throw new SessionFormatError(`${memberLabel} content must contain one text block`);
	}).length !== 1) throw new SessionFormatError(`${label} messages must contain one user message`);
	if (arrayValue(body["tools"], `${label} tools`, (member, memberLabel) => {
		const tool = exactRecord(member, memberLabel, [
			"type",
			"name",
			"max_uses"
		]);
		literalValue(tool["type"], ["web_search_20250305"], `${memberLabel} type`);
		literalValue(tool["name"], ["web_search"], `${memberLabel} name`);
		positiveIntegerValue(tool["max_uses"], `${memberLabel} max_uses`);
	}).length !== 1) throw new SessionFormatError(`${label} tools must contain one web search tool`);
}
//#endregion
//#region lib/types/validation.js
const HEADER_REQUIRED = [
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
const SURFACE_EVENT_TYPES = new Set([
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
const LEGACY_SOURCE_TYPES = new Set([
	"steering/message",
	"request/header-delta",
	"mode/set",
	"compact/start",
	"compact/summary",
	"compact/end",
	"compact/prune"
]);
/**
* Validate the logical header shared by released v0 and v1.
* @param header - detached logical header.
* @param version - exact expected generation.
*/
function assertReleasedSessionFormatHeader(header, version) {
	const record = releasedV0Record(header, `format v${version} header`);
	assertReleasedV0Keys(record, HEADER_REQUIRED, HEADER_OPTIONAL, `format v${version} header`);
	if (record["version"] !== version) throw new SessionFormatError(`expected format v${version} header`);
	if (typeof record["id"] !== "string") throw new SessionFormatError(`format v${version} header id must be a string`);
	sessionFormatCount(record["createdAt"], `format v${version} header createdAt`);
	if (typeof record["isSeeded"] !== "boolean") throw new SessionFormatError(`format v${version} header isSeeded must be a boolean`);
	sessionFormatCount(record["delegationDepth"], `format v${version} header delegationDepth`);
	for (const key of [
		"cwd",
		"parentSession",
		"agentPreset"
	]) if (record[key] !== void 0 && typeof record[key] !== "string") throw new SessionFormatError(`format v${version} header ${key} must be a string`);
	if (typeof record["cwd"] === "string" && !isAbsolute(record["cwd"])) throw new SessionFormatError(`format v${version} header cwd must be absolute`);
	if (record["origin"] !== void 0 && record["origin"] !== "subagent") throw new SessionFormatError(`format v${version} header origin must be "subagent"`);
}
/**
* Validate one released-v1 logical header.
* @param header - detached logical header.
*/
function assertReleasedV1Header(header) {
	assertReleasedSessionFormatHeader(header, 1);
}
/**
* Restore v1 against the installed build's ordinary event vocabulary without freezing payload additions.
* @param artifact - vocabulary-neutral released-v1 physical decode.
* @param knownEventTypes - event types understood by the installed current Session package.
* @returns the same validated detached artifact.
*/
function restoreReleasedV1Artifact(artifact, knownEventTypes) {
	assertReleasedV1Header(artifact.header);
	assertReleasedArtifactCoordinates(artifact, false, knownEventTypes);
	return artifact;
}
/**
* Validate released-v0/v1 artifact coordinates under an explicit vocabulary policy.
* @param artifact - logical artifact to validate.
* @param allowLegacySteering - whether to accept the retired steering event name.
* @param knownEventTypes - installed event vocabulary, when vocabulary-aware.
* @param vocabularyNeutral - whether unknown event types remain opaque.
* @param frozenEnvelope - whether event envelopes must already be frozen.
*/
function assertReleasedArtifactCoordinates(artifact, allowLegacySteering, knownEventTypes, vocabularyNeutral = false, frozenEnvelope = false) {
	const inheritedEventCount = sessionFormatCount(artifact.inheritedEventCount, "Session inheritedEventCount");
	if (inheritedEventCount > artifact.events.length) throw new SessionFormatError("Session inheritedEventCount exceeds its event count");
	if (!artifact.header.isSeeded && inheritedEventCount !== 0) throw new SessionFormatError("unseeded Session inheritedEventCount must be 0");
	for (let index = 0; index < artifact.events.length; index += 1) {
		const event = artifact.events[index];
		const record = releasedV0Record(event, `Session event ${index}`);
		const type = record["type"];
		if (typeof type !== "string") throw new SessionFormatError(`Session event ${index} type must be a string`);
		const disposition = RELEASED_V0_EVENT_DISPOSITIONS[type];
		const legacy = allowLegacySteering && LEGACY_SOURCE_TYPES.has(type);
		const currentKnown = knownEventTypes?.has(type) === true;
		const ignorableCurrent = !allowLegacySteering && !currentKnown && record["ignorable"] === true;
		if (!currentKnown && !legacy && !ignorableCurrent && !vocabularyNeutral) {
			if (allowLegacySteering) throw new SessionFormatUnsupportedMigrationError(`format v0 contains unknown historical event type ${JSON.stringify(type)} at seq ${index}; migration refuses unknown historical events even when ignorable`);
			throw new SessionFormatUnsupportedMigrationError(`format v1 contains unknown required event type ${JSON.stringify(type)} at seq ${index}`);
		}
		const surface = disposition !== void 0 ? SURFACE_EVENT_TYPES.has(type) : type === "steering/message";
		assertReleasedV0Keys(record, EVENT_REQUIRED, frozenEnvelope ? surface ? SURFACE_OPTIONAL : LOG_OPTIONAL : SURFACE_OPTIONAL, `Session event ${index}`);
		if (record["seq"] !== index) throw new SessionFormatError(`Session event ${index} has non-dense seq ${JSON.stringify(record["seq"])}`);
		sessionFormatSafeInteger(record["time"], `Session event ${index} time`);
		if (record["ignorable"] !== void 0 && record["ignorable"] !== true) throw new SessionFormatError(`Session event ${index} ignorable must be true when present`);
		if (frozenEnvelope && surface) assertReleasedSurfaceMetadata(record, index, type, "allow-empty-assistant");
	}
}
/**
* Validate shared-layout surface references for one released generation.
* @param record - exact event envelope.
* @param seq - event position used for earlier-reference checks.
* @param type - surface event type used in diagnostics.
* @param assistantSources - whether this generation admits empty Assistant chunk provenance.
*/
function assertReleasedSurfaceMetadata(record, seq, type, assistantSources) {
	const sources = record["sourceEventSeqs"];
	if (type === "assistant/message" && sources !== void 0 && assistantSources === "forbid-assistant") throw new SessionFormatError(`assistant/message ${seq} retains obsolete chunk provenance`);
	if (sources !== void 0) {
		if (!Array.isArray(sources)) throw new SessionFormatError(`${type} ${seq} sourceEventSeqs must be an array`);
		const seen = /* @__PURE__ */ new Set();
		for (const source of sources) {
			const current = sessionFormatCount(source, `${type} ${seq} sourceEventSeqs member`);
			if (current >= seq || seen.has(current)) throw new SessionFormatError(`${type} ${seq} sourceEventSeqs must be unique earlier seqs`);
			seen.add(current);
		}
		if (sources.length === 0 && type !== "assistant/message") throw new SessionFormatError(`${type} ${seq} sourceEventSeqs must be non-empty`);
	}
	const operation = record["surfaceOp"];
	if (operation === void 0 || operation === "append") return;
	const replacement = releasedV0Record(operation, `${type} ${seq} surfaceOp`);
	assertReleasedV0Keys(replacement, [
		"op",
		"start",
		"end"
	], [], `${type} ${seq} surfaceOp`);
	if (replacement["op"] !== "replace") throw new SessionFormatError(`${type} ${seq} surfaceOp must replace`);
	const start = sessionFormatCount(replacement["start"], `${type} ${seq} surface start`);
	const end = sessionFormatCount(replacement["end"], `${type} ${seq} surface end`);
	if (start >= seq || end >= seq) throw new SessionFormatError(`${type} ${seq} has an invalid surface replacement`);
}
/**
* Validate one exact known payload after legacy normalization.
* @param event - known event to validate.
* @param version - payload generation controlling versioned members.
*/
function assertReleasedEventPayload(event, version) {
	const disposition = RELEASED_V0_EVENT_DISPOSITIONS[event.type];
	/* v8 ignore next -- artifact coordinate validation admits only the frozen inventory before payload validation. */
	if (disposition === void 0) throw new SessionFormatUnsupportedMigrationError(`format v0 contains unknown historical event type ${JSON.stringify(event.type)} at seq ${event.seq}; migration refuses unknown historical events even when ignorable`);
	const data = releasedV0Record(event.data, `${event.type} ${event.seq} data`);
	if (event.type === "subagent/descriptor" && data["version"] !== 3) {
		const descriptorVersion = sessionFormatCount(data["version"], `${event.type} ${event.seq} version`);
		if (version === 0) throw new SessionFormatUnsupportedMigrationError(`${event.type} ${event.seq} uses unsupported descriptor version ${descriptorVersion}`);
		return;
	}
	const versionOptional = version === 1 && event.type === "session-log-deepseek/delivery-accepted" ? [...disposition.optional, "sessionFormatVersion"] : disposition.optional;
	assertReleasedV0Keys(data, disposition.required, versionOptional, `${event.type} ${event.seq} data`);
	for (const key of disposition.opaque) if (Object.hasOwn(data, key) && !isJsonValue(data[key])) throw new SessionFormatError(`${event.type} ${event.seq} opaque ${key} is not lossless JSON`);
	assertReleasedPayloadSemantics(event, version);
}
//#endregion
//#region lib/types/codec.js
const PHYSICAL_HEADER_REQUIRED = [
	"type",
	"version",
	"id",
	"createdAt",
	"delegationDepth"
];
const PHYSICAL_HEADER_OPTIONAL = [
	"cwd",
	"parentSession",
	"seedLength",
	"origin",
	"agentPreset"
];
const PACKED_TAGS = new Set([
	"text-chunks",
	"reasoning-chunks",
	"tool-call-chunks"
]);
/**
* Test whether a compact migration item is a released packed Assistant row.
* @param run - compact migration item to classify.
* @returns whether the item carries the released Assistant chunk representation.
*/
function isReleasedAssistantChunkRun(run) {
	return run.runType === "released-assistant-chunks";
}
/** Frozen physical JSON codec for the released v0 layout. */
const releasedV0SessionFormatCodec = createReleasedCodec(0);
/** Frozen physical JSON codec for the shared-layout released v1 format. */
const releasedV1SessionFormatCodec = createReleasedCodec(1);
function createReleasedCodec(version) {
	return Object.freeze({
		version,
		decodeHeader: (value) => decodeHeader(value, version),
		createDecoder(headerValue, recovery) {
			const physical = decodePhysicalHeader(headerValue, version);
			const scanner = scanRows(recovery === "recoverable");
			return {
				header: physical.header,
				headerInheritedEventCount: physical.inheritedEventCount,
				decodeRow: (rowValue, context) => {
					scanner.decodeRow(rowValue, context);
				},
				finish(_context) {
					scanner.finish(physical.inheritedEventCount);
					return physical.inheritedEventCount;
				}
			};
		}
	});
}
function scanRows(recoverable) {
	let rowIndex = 0;
	let eventCount = 0;
	let issue;
	return {
		decodeRow(rowValue, context) {
			const currentRow = rowIndex;
			rowIndex += 1;
			let packed = false;
			let decoded;
			try {
				const record = releasedV0Record(rowValue, `released Session row ${currentRow}`);
				const type = record["type"];
				if (typeof type === "string" && PACKED_TAGS.has(type)) {
					packed = true;
					decoded = decodePackedRun(record, type, currentRow);
				} else decoded = decodeEvent(record, currentRow);
			} catch (error) {
				const current = error instanceof SessionFormatError ? error : new SessionFormatError(`released Session row ${currentRow} is malformed`, { cause: error });
				if (!recoverable) throw current;
				issue ??= current;
				return;
			}
			if (issue !== void 0) {
				if (!packed && decoded.type === "turn/end") throw issue;
				return;
			}
			const seq = packed ? decoded.firstSeq : decoded.seq;
			if (seq !== eventCount) {
				const gap = new SessionFormatError(`released Session row ${currentRow} has seq gap (expected ${eventCount}, got ${seq})`);
				if (!recoverable) throw gap;
				issue = gap;
				if (!packed && decoded.type === "turn/end") throw gap;
				return;
			}
			if (packed) {
				const run = decoded;
				eventCount += run.eventCount;
				context.emitRun(run);
			} else {
				eventCount += 1;
				context.emitEvent(decoded);
			}
		},
		finish(inheritedEventCount) {
			if (inheritedEventCount > eventCount) throw new SessionFormatError("Session inheritedEventCount exceeds its event count");
		}
	};
}
function decodeHeader(value, version) {
	return decodePhysicalHeader(value, version).header;
}
function decodePhysicalHeader(value, version) {
	const record = releasedV0Record(snapshotSessionFormatJson(value, `released v${version} physical header`), `released v${version} physical header`);
	assertReleasedV0Keys(record, PHYSICAL_HEADER_REQUIRED, PHYSICAL_HEADER_OPTIONAL, `released v${version} physical header`);
	if (record["type"] !== "session" || record["version"] !== version) throw new SessionFormatError(`expected released v${version} physical Session header`);
	if (typeof record["id"] !== "string") throw new SessionFormatError(`released v${version} header id must be a string`);
	const createdAt = sessionFormatCount(record["createdAt"], `released v${version} header createdAt`);
	const delegationDepth = sessionFormatCount(record["delegationDepth"], `released v${version} header delegationDepth`);
	const seedLength = record["seedLength"] === void 0 ? 0 : sessionFormatCount(record["seedLength"], `released v${version} header seedLength`);
	for (const key of [
		"cwd",
		"parentSession",
		"agentPreset"
	]) if (record[key] !== void 0 && typeof record[key] !== "string") throw new SessionFormatError(`released v${version} header ${key} must be a string`);
	if (record["origin"] !== void 0 && record["origin"] !== "subagent") throw new SessionFormatError(`released v${version} header origin must be "subagent"`);
	const header = {
		version,
		id: record["id"],
		createdAt,
		...record["cwd"] === void 0 ? {} : { cwd: record["cwd"] },
		...record["parentSession"] === void 0 ? {} : { parentSession: record["parentSession"] },
		isSeeded: record["seedLength"] !== void 0,
		...record["origin"] === void 0 ? {} : { origin: record["origin"] },
		delegationDepth,
		...record["agentPreset"] === void 0 ? {} : { agentPreset: record["agentPreset"] }
	};
	assertReleasedSessionFormatHeader(header, version);
	return {
		header,
		inheritedEventCount: seedLength
	};
}
function decodeEvent(record, rowIndex) {
	if (record["sourceEventSeqs"] !== void 0) {
		const seq = sessionFormatCount(record["seq"], `released Session row ${rowIndex} seq`);
		return {
			...record,
			sourceEventSeqs: decodeSeqRanges(record["sourceEventSeqs"], seq)
		};
	}
	return record;
}
function decodePackedRun(row, type, rowIndex) {
	const label = `released ${type} row ${rowIndex}`;
	assertReleasedV0Keys(row, [
		"type",
		"seq0",
		"time0",
		"data"
	], [], label);
	const seq0 = sessionFormatCount(row["seq0"], `${label} seq0`);
	const time0 = sessionFormatSafeInteger(row["time0"], `${label} time0`);
	const data = releasedV0Record(row["data"], `${label} data`);
	const isTool = type === "tool-call-chunks";
	assertReleasedV0Keys(data, isTool ? [
		"turn",
		"step",
		"index",
		"id",
		"dt",
		"args"
	] : [
		"turn",
		"step",
		"index",
		"dt",
		"texts"
	], isTool ? ["name"] : [], `${label} data`);
	const payload = data[isTool ? "args" : "texts"];
	if (!Array.isArray(payload) || payload.length === 0 || payload.some((member) => typeof member !== "string")) throw new SessionFormatError(`${label} payload must be a non-empty string array`);
	const gaps = data["dt"];
	if (!Array.isArray(gaps) || gaps.length !== payload.length - 1) throw new SessionFormatError(`${label} dt length must match its payload`);
	let lastTime = time0;
	for (const gap of gaps) {
		const validGap = sessionFormatSafeInteger(gap, `${label} dt member`);
		lastTime = sessionFormatSafeInteger(lastTime + validGap, `${label} member time`);
	}
	const turn = sessionFormatCount(data["turn"], `${label} turn`);
	const step = sessionFormatCount(data["step"], `${label} step`);
	const chunkIndex = sessionFormatCount(data["index"], `${label} index`);
	if (isTool && (typeof data["id"] !== "string" || data["id"].length === 0 || data["name"] !== void 0 && typeof data["name"] !== "string")) throw new SessionFormatError(`${label} id and optional name must be strings`);
	const lastSeq = sessionFormatCount(seq0 + payload.length - 1, `${label} final seq`);
	const stream = type === "tool-call-chunks" ? {
		type,
		time0,
		index: chunkIndex,
		dt: gaps,
		id: data["id"],
		...data["name"] === void 0 ? {} : { name: data["name"] },
		args: payload
	} : {
		type,
		time0,
		index: chunkIndex,
		dt: gaps,
		texts: payload
	};
	const run = {
		runType: "released-assistant-chunks",
		firstSeq: seq0,
		eventCount: payload.length,
		turn,
		step,
		lastSeq,
		lastTime,
		stream,
		expand: () => expandAssistantChunkRun(run)
	};
	return run;
}
function* expandAssistantChunkRun(run) {
	const stream = run.stream;
	const gaps = stream["dt"];
	const members = stream["type"] === "tool-call-chunks" ? stream["args"] : stream["texts"];
	let time = run.stream["time0"];
	for (let index = 0; index < members.length; index += 1) {
		if (index > 0) time += gaps[index - 1];
		const member = members[index];
		const chunk = stream["type"] === "text-chunks" ? {
			type: "text-delta",
			index: stream["index"],
			text: member
		} : stream["type"] === "reasoning-chunks" ? {
			type: "reasoning-delta",
			index: stream["index"],
			text: member
		} : {
			type: "tool-call-delta",
			index: stream["index"],
			id: stream["id"],
			...stream["name"] === void 0 ? {} : { name: stream["name"] },
			argumentsDelta: member
		};
		yield {
			type: "assistant/chunk",
			seq: run.firstSeq + index,
			time,
			data: {
				turn: run.turn,
				step: run.step,
				chunk
			}
		};
	}
}
function decodeSeqRanges(value, maxEntries) {
	if (!Array.isArray(value)) throw new SessionFormatError("sourceEventSeqs must be an array");
	const output = [];
	let hasRange = false;
	for (const entry of value) {
		if (typeof entry === "number") {
			if (output.length >= maxEntries) throw new SessionFormatError("sourceEventSeqs exceeds its event seq");
			output.push(sessionFormatCount(entry, "sourceEventSeqs member"));
			continue;
		}
		if (!Array.isArray(entry) || entry.length !== 2) throw new SessionFormatError("sourceEventSeqs range must be a [start, end] pair");
		const start = sessionFormatCount(entry[0], "sourceEventSeqs range start");
		const end = sessionFormatCount(entry[1], "sourceEventSeqs range end");
		if (end < start || end - start + 1 > maxEntries - output.length) throw new SessionFormatError("sourceEventSeqs range exceeds its event seq");
		for (let seq = start; seq <= end; seq += 1) output.push(seq);
		hasRange = true;
	}
	if (hasRange && output.some((member, index) => index > 0 && member <= output[index - 1])) throw new SessionFormatError("sourceEventSeqs ranges must be strictly increasing");
	return output;
}
//#endregion
//#region lib/types/migration.js
/** Identity format edge that promotes released v0 into released v1. */
const sessionFormatV0ToV1 = defineSessionFormatMigration({
	name: "@deepseek-ai/dsh-session-format-v0-to-v1",
	fromVersion: 0,
	toVersion: 1,
	migrateHeader(header) {
		assertHeaderVersion(header, 0);
		return {
			...header,
			version: 1
		};
	},
	createStage(input) {
		return new ReleasedV0ToV1Stage(input);
	},
	validateTargetHeader: assertReleasedV1Header
});
var ReleasedV0ToV1Stage = class {
	input;
	headerInheritedEventCount;
	state = {
		messageIds: /* @__PURE__ */ new Map(),
		retryIds: /* @__PURE__ */ new Map()
	};
	constructor(input) {
		this.input = input;
		assertHeaderVersion(input.sourceHeader, 0);
		this.headerInheritedEventCount = sessionFormatCount(input.sourceInheritedEventCount, "format v0 inherited event count");
	}
	transformEvent(event, context) {
		const normalized = normalizeReleasedV0Event(event, this.input.sourceHeader.id, this.state);
		assertSourceDeliveryMarker(normalized, this.input);
		context.emitEvent(normalized);
	}
	transformRun(run, context) {
		if (isReleasedAssistantChunkRun(run)) {
			context.emitRun(run);
			return;
		}
		for (const event of run.expand()) this.transformEvent(event, context);
	}
	finish(_context) {
		return this.headerInheritedEventCount;
	}
};
function assertHeaderVersion(header, version) {
	if (header.version !== version) throw new SessionFormatError(`expected format v${version} header`);
}
function normalizeReleasedV0Event(event, sessionId, state) {
	const named = normalizeLegacyCompactionType(event);
	assertSupportedLegacyType(named, sessionId);
	const message = normalizeLegacyMessage(normalizeLegacyCompaction(normalizeLegacyRetry(normalizeLegacySteering(normalizeLegacyRequestHeader(normalizeLegacyTurnEnd(normalizeLegacyTurnStart(named, sessionId), sessionId), sessionId), sessionId), sessionId, state.retryIds), sessionId, state), sessionId, state.messageIds);
	if (message.type !== "assistant/chunk") assertReleasedEventPayload(message, 0);
	const messageId = eventMessageId(message);
	if (messageId !== void 0) state.messageIds.set(message.seq, messageId);
	return message;
}
function normalizeLegacyCompactionType(event) {
	switch (event.type) {
		case "compact/start": return {
			...event,
			type: "compaction/start"
		};
		case "compact/summary": return {
			...event,
			type: "compaction/summary"
		};
		case "compact/end": return {
			...event,
			type: "compaction/end"
		};
		case "compact/prune": return {
			...event,
			type: "compaction/prune"
		};
		default: return event;
	}
}
function assertSourceDeliveryMarker(event, input) {
	if (event.type !== "session-log-deepseek/delivery-accepted") return;
	const data = releasedV0Record(event.data, `${event.type} ${event.seq} data`);
	const acceptedVersion = data["sessionFormatVersion"] ?? 0;
	const inherited = input.sourceHeader.parentSession !== void 0 && event.seq < sessionFormatCount(input.sourceInheritedEventCount, "format v0 inherited event count");
	if (acceptedVersion === 0 && !inherited && data["sessionId"] !== input.sourceHeader.id) throw new SessionFormatError("current-generation delivery marker names the wrong Session");
}
function normalizeLegacyRetry(event, sessionId, retryIds) {
	if (event.type !== "llm/retry") return event;
	const data = releasedV0Record(event.data, `llm/retry ${event.seq} data`);
	const chain = [
		data["turn"],
		data["step"],
		data["provider"],
		data["policyKey"]
	].map((value) => JSON.stringify(value)).join("\0");
	const retryId = data["retryId"];
	if (typeof retryId === "string" && retryId.length > 0) {
		retryIds.set(chain, retryId);
		return event;
	}
	if (Object.hasOwn(data, "retryId")) return event;
	const migratedRetryId = retryIds.get(chain) ?? `legacy-retry:${sessionId}:${event.seq}`;
	retryIds.set(chain, migratedRetryId);
	return {
		...event,
		data: {
			...data,
			retryId: migratedRetryId
		}
	};
}
function normalizeLegacyCompaction(event, sessionId, state) {
	if (event.type === "session/end-seed") {
		delete state.compactionId;
		return event;
	}
	if (event.type === "compaction/start") {
		const data = releasedV0Record(event.data, `compaction/start ${event.seq} data`);
		const existing = data["compactionId"];
		if (typeof existing === "string" && existing.length > 0) {
			state.compactionId = existing;
			return event;
		}
		if (Object.hasOwn(data, "compactionId")) return event;
		const id = `legacy-compaction:${sessionId}:${event.seq}`;
		state.compactionId = id;
		return {
			...event,
			data: {
				...data,
				compactionId: id
			}
		};
	}
	const compactionId = state.compactionId;
	if (compactionId === void 0) return event;
	if (event.type === "compaction/summary" || event.type === "compaction/end") {
		const normalized = addLegacyCompactionId(event, compactionId);
		if (event.type === "compaction/end") delete state.compactionId;
		return normalized;
	}
	if (event.type !== "user/message") return event;
	const data = releasedV0Record(event.data, `user/message ${event.seq} data`);
	const source = data["source"];
	if (!releasedIsRecord(source) || source["kind"] !== "plugin" || source["plugin"] !== "compact" || Object.hasOwn(source, "compactionId")) return event;
	return {
		...event,
		data: {
			...data,
			source: {
				...source,
				compactionId
			}
		}
	};
}
function addLegacyCompactionId(event, compactionId) {
	const data = releasedV0Record(event.data, `${event.type} ${event.seq} data`);
	if (Object.hasOwn(data, "compactionId")) return event;
	return {
		...event,
		data: {
			...data,
			compactionId
		}
	};
}
function normalizeLegacyRequestHeader(event, sessionId) {
	if (event.type !== "request/header") return event;
	const data = releasedV0Record(event.data, `request/header ${event.seq} data`);
	const header = releasedV0Record(data["header"], `request/header ${event.seq} header`);
	if (!Object.hasOwn(header, "messagePrefix")) return event;
	if (!Array.isArray(header["messagePrefix"])) throw new SessionFormatError(`session ${JSON.stringify(sessionId)} contains malformed request/header messagePrefix at seq ${event.seq}`);
	const { messagePrefix: _messagePrefix, ...currentHeader } = header;
	return {
		...event,
		data: {
			...data,
			header: currentHeader
		}
	};
}
function assertSupportedLegacyType(event, sessionId) {
	if (event.type === "request/header-delta" || event.type === "mode/set") throw new SessionFormatUnsupportedMigrationError(`session ${JSON.stringify(sessionId)} contains unsupported legacy ${event.type} event at seq ${event.seq}`);
	if (event.type === "request/header") {
		if (releasedV0Record(event.data, `request/header ${event.seq} data`)["reason"] === "fallback") throw new SessionFormatUnsupportedMigrationError(`session ${JSON.stringify(sessionId)} contains unsupported request/header reason "fallback" at seq ${event.seq}`);
	}
}
function normalizeLegacySteering(event, sessionId) {
	if (event.type !== "steering/message") return event;
	const data = releasedV0Record(event.data, `steering/message ${event.seq} data`);
	const wrapped = data["message"];
	if (wrapped !== void 0) {
		assertReleasedV0Keys(data, ["turn", "message"], [], `steering/message ${event.seq} data`);
		sessionFormatCount(data["turn"], `steering/message ${event.seq} turn`);
		return {
			...event,
			type: "user/message",
			data: wrapped
		};
	}
	assertReleasedV0Keys(data, [
		"turn",
		"content",
		"source"
	], [], `steering/message ${event.seq} data`);
	sessionFormatCount(data["turn"], `steering/message ${event.seq} turn`);
	const { turn: _turn, ...message } = data;
	return {
		...event,
		type: "user/message",
		data: {
			...message,
			id: legacyMessageId(sessionId, event.seq),
			role: "user"
		}
	};
}
function normalizeLegacyTurnStart(event, sessionId) {
	if (event.type !== "turn/start") return event;
	const data = releasedV0Record(event.data, `turn/start ${event.seq} data`);
	if (!Object.hasOwn(data, "trigger")) return event;
	assertReleasedV0Keys(data, ["turn", "trigger"], [], `turn/start ${event.seq} data`);
	const turn = sessionFormatCount(data["turn"], `turn/start ${event.seq} turn`);
	const trigger = releasedV0Record(data["trigger"], `turn/start ${event.seq} trigger`);
	if (turn < 1 || typeof trigger["kind"] !== "string" || trigger["kind"].length === 0) throw malformedLegacy(sessionId, "turn/start", event.seq);
	return {
		...event,
		data: { turn }
	};
}
function normalizeLegacyTurnEnd(event, sessionId) {
	if (event.type !== "turn/end") return event;
	const data = releasedV0Record(event.data, `turn/end ${event.seq} data`);
	assertReleasedV0Keys(data, ["turn", "reason"], [], `turn/end ${event.seq} data`);
	if (sessionFormatCount(data["turn"], `turn/end ${event.seq} turn`) < 1) throw malformedLegacy(sessionId, "turn/end", event.seq);
	const reason = releasedV0Record(data["reason"], `turn/end ${event.seq} reason`);
	if (typeof reason["kind"] !== "string") throw malformedLegacy(sessionId, "turn/end", event.seq);
	let current;
	switch (reason["kind"]) {
		case "completed":
		case "blocked":
		case "max-tokens":
		case "interrupted":
			assertReleasedV0Keys(reason, ["kind"], [], `turn/end ${event.seq} reason`);
			return event;
		case "aborted":
			if (Object.hasOwn(reason, "reason")) return event;
			assertReleasedV0Keys(reason, ["kind"], [], `turn/end ${event.seq} reason`);
			current = {
				kind: "aborted",
				reason: { kind: "legacy" }
			};
			break;
		case "disposed":
			assertReleasedV0Keys(reason, ["kind"], [], `turn/end ${event.seq} reason`);
			current = {
				kind: "aborted",
				reason: { kind: "disposed" }
			};
			break;
		case "error":
			if (Object.hasOwn(reason, "error")) return event;
			current = normalizeLegacyErrorReason(reason, event.seq, sessionId);
			break;
		default: return event;
	}
	return {
		...event,
		data: {
			...data,
			reason: current
		}
	};
}
function normalizeLegacyErrorReason(reason, seq, sessionId) {
	sessionFormatCount(reason["step"], `turn/end ${seq} error step`);
	const failure = reason["failure"];
	if (failure !== void 0) {
		assertReleasedV0Keys(reason, [
			"kind",
			"step",
			"failure"
		], [], `turn/end ${seq} reason`);
		const record = releasedV0Record(failure, `turn/end ${seq} failure`);
		assertReleasedV0Keys(record, ["message", "code"], [
			"status",
			"providerRetryAfterMs",
			"requestId"
		], `turn/end ${seq} failure`);
		if (typeof record["message"] !== "string" || typeof record["code"] !== "string") throw malformedLegacy(sessionId, "turn/end", seq);
		return {
			kind: "error",
			error: record
		};
	}
	assertReleasedV0Keys(reason, [
		"kind",
		"step",
		"message"
	], ["code"], `turn/end ${seq} reason`);
	if (typeof reason["message"] !== "string" || reason["code"] !== void 0 && typeof reason["code"] !== "string") throw malformedLegacy(sessionId, "turn/end", seq);
	return {
		kind: "error",
		error: {
			message: reason["message"],
			code: typeof reason["code"] === "string" ? reason["code"] : "UNKNOWN"
		}
	};
}
function normalizeLegacyMessage(event, sessionId, messageIds) {
	const data = releasedV0Record(event.data, `${event.type} ${event.seq} data`);
	switch (event.type) {
		case "user/message":
			if (Object.hasOwn(data, "id") || Object.hasOwn(data, "role") || Object.hasOwn(data, "message") || !Object.hasOwn(data, "content") || !Object.hasOwn(data, "source")) return event;
			return {
				...event,
				data: {
					...data,
					id: legacyMessageId(sessionId, event.seq),
					role: "user"
				}
			};
		case "assistant/message": {
			if (Object.hasOwn(data, "message") || !Object.hasOwn(data, "content") || !Object.hasOwn(data, "provenance")) return event;
			const { content, provenance, ...eventData } = data;
			const source = releasedV0Record(provenance, `assistant/message ${event.seq} provenance`);
			return {
				...event,
				data: {
					...eventData,
					message: {
						id: legacyMessageId(sessionId, event.seq),
						role: "assistant",
						content,
						source: {
							...source,
							kind: "model"
						}
					}
				}
			};
		}
		case "tool/result": {
			if (Object.hasOwn(data, "message") || !Object.hasOwn(data, "callId") || !Object.hasOwn(data, "content") || !Object.hasOwn(data, "isError")) return event;
			const { callId, content, isError, ...eventData } = data;
			if (typeof callId !== "string" || typeof isError !== "boolean" || content === void 0) return event;
			const inheritedId = replacementStart(event);
			const messageId = inheritedId === void 0 ? legacyMessageId(sessionId, event.seq) : messageIds.get(inheritedId);
			if (messageId === void 0) throw new SessionFormatError(`tool/result ${event.seq} replacement cites a message without identity`);
			return {
				...event,
				data: {
					...eventData,
					message: {
						id: messageId,
						role: "user",
						content: [{
							type: "tool-result",
							toolCallId: callId,
							content,
							isError
						}],
						source: {
							kind: "tool",
							callId
						}
					}
				}
			};
		}
		default: return event;
	}
}
function replacementStart(event) {
	const operation = event["surfaceOp"];
	if (operation === void 0 || !releasedIsRecord(operation) || operation["op"] !== "replace") return void 0;
	return operation["start"];
}
function eventMessageId(event) {
	const data = releasedV0Record(event.data, `${event.type} ${event.seq} data`);
	const message = event.type === "user/message" ? data : releasedIsRecord(data["message"]) ? data["message"] : void 0;
	return typeof message?.["id"] === "string" ? message["id"] : void 0;
}
function releasedIsRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function legacyMessageId(sessionId, seq) {
	return `legacy-message:${sessionId}:${seq}`;
}
function malformedLegacy(sessionId, type, seq) {
	return new SessionFormatError(`session ${JSON.stringify(sessionId)} contains malformed pre-react-loop ${type} at seq ${seq}`);
}
//#endregion
//#region lib/types/relationships.js
const SURFACE_TYPES = new Set([
	"user/message",
	"assistant/message",
	"tool/result"
]);
/**
* Validate cross-event relationships required to construct one current Session safely.
* @param artifact - complete normalized v0 or exact current v1 artifact.
* @param extensions - later-generation event roles interpreted by the calling format owner.
*/
function assertReleasedArtifactRelationships(artifact, extensions = {}) {
	let openTurn = null;
	let openStep = null;
	let openStepProvider;
	let nextTurn = 1;
	let nextStep = 1;
	let surface = [];
	let openCompaction;
	const staleCompactionStarts = inheritedOrphanCompactionStarts(artifact.events);
	const retries = [];
	const retryStarts = /* @__PURE__ */ new Set();
	const ptcRoots = /* @__PURE__ */ new Map();
	const ptcStarts = /* @__PURE__ */ new Map();
	const toolLifecycles = /* @__PURE__ */ new Map();
	const commandRuns = /* @__PURE__ */ new Set();
	for (const event of artifact.events) {
		const extensionStepEvent = extensions.stepEvents?.has(event.type) === true;
		if (RELEASED_V0_EVENT_DISPOSITIONS[event.type] === void 0 && !extensionStepEvent) continue;
		const data = releasedV0Record(event.data, `${event.type} ${event.seq} data`);
		if (SURFACE_TYPES.has(event.type)) surface = applySurface(surface, event);
		if ((event.type === "turn/start" || event.type === "turn/end") && openCompaction !== void 0 && !staleCompactionStarts.has(openCompaction.startSeq)) throw new SessionFormatError(`${event.type} crosses an open compaction`);
		if (extensionStepEvent) {
			requireOpenStep(event, data, openTurn, openStep);
			continue;
		}
		switch (event.type) {
			case "turn/start": {
				const previous = artifact.events[event.seq - 1];
				if (extensions.legacyInterruptedTurnRestart === true && openTurn !== null && openStep === null && data["turn"] === openTurn + 1 && nextTurn === openTurn && previous?.type === "agent/inbox/spliced") {
					const splice = releasedV0Record(previous.data, `agent/inbox/spliced ${previous.seq} data`);
					if (splice["target"] === "next-turn" && Array.isArray(splice["inserted"]) && splice["inserted"].length > 0) {
						openTurn = null;
						nextTurn += 1;
					}
				}
				if (openTurn !== null || data["turn"] !== nextTurn) throw new SessionFormatError(`turn/start ${JSON.stringify(data["turn"])} does not open expected turn ${nextTurn}`);
				openTurn = data["turn"];
				openStep = null;
				toolLifecycles.clear();
				nextStep = 1;
				break;
			}
			case "turn/end":
				if (openTurn !== data["turn"]) throw new SessionFormatError(`turn/end ${JSON.stringify(data["turn"])} has no matching open turn`);
				assertNoUnresolvedTools(toolLifecycles, "turn/end");
				if (openStep !== null) throw new SessionFormatError(`turn/end ${JSON.stringify(data["turn"])} crosses an open step`);
				openTurn = null;
				nextTurn += 1;
				break;
			case "step/start":
				if (openTurn !== data["turn"] || openStep !== null || data["step"] !== nextStep) throw new SessionFormatError(`${event.type} does not match the open turn and next step`);
				openStep = data["step"];
				break;
			case "step/end":
				requireOpenStep(event, data, openTurn, openStep);
				assertNoUnresolvedTools(toolLifecycles, "step/end");
				toolLifecycles.clear();
				openStep = null;
				nextStep += 1;
				break;
			case "assistant/chunk":
				requireOpenStep(event, data, openTurn, openStep);
				break;
			case "assistant/message": {
				requireOpenStep(event, data, openTurn, openStep);
				const content = releasedV0Record(data["message"], `assistant/message ${event.seq} message`)["content"];
				for (const block of content) {
					if (block["type"] !== "tool-call") continue;
					const callId = block["id"];
					if (toolLifecycles.has(callId)) throw new SessionFormatError(`assistant/message repeats advertised tool call ${callId}`);
					toolLifecycles.set(callId, {
						name: block["name"],
						arguments: block["arguments"],
						state: "advertised"
					});
				}
				break;
			}
			case "tool/call": {
				requireOpenStep(event, data, openTurn, openStep);
				const callId = data["callId"];
				const lifecycle = toolLifecycles.get(callId);
				if (lifecycle === void 0 || lifecycle.state !== "advertised" || lifecycle.name !== data["name"] || lifecycle.arguments !== data["arguments"]) throw new SessionFormatError(`tool/call ${callId} does not match one advertised tool call`);
				lifecycle.state = "started";
				break;
			}
			case "tool/result":
				if (event["surfaceOp"] === "append") {
					requireOpenStep(event, data, openTurn, openStep);
					const message = releasedV0Record(data["message"], `tool/result ${event.seq} message`);
					const callId = releasedV0Record(message["source"], `tool/result ${event.seq} source`)["callId"];
					const content = message["content"];
					const error = data["error"] === void 0 ? void 0 : releasedV0Record(data["error"], `tool/result ${event.seq} error`);
					const lifecycle = toolLifecycles.get(callId);
					if (lifecycle === void 0) throw new SessionFormatError(`tool/result ${callId} has no advertised tool lifecycle`);
					if (lifecycle.state === "advertised" && !isExactToolNotStartedRepair(event, content, error)) throw new SessionFormatError(`tool/result ${callId} is not the exact TOOL_NOT_STARTED repair`);
					toolLifecycles.delete(callId);
				} else if (openTurn === null) throw new SessionFormatError("tool/result replacement is outside an open turn");
				break;
			case "request/header":
				if (openTurn === null) throw new SessionFormatError(`${event.type} is outside an open turn`);
				openStepProvider = data["header"]["config"]["provider"];
				break;
			case "request/context":
				if (openTurn === null) throw new SessionFormatError(`${event.type} is outside an open turn`);
				break;
			case "tool/code-dispatch-start":
			case "tool/code-dispatch": {
				if (openTurn === null) throw new SessionFormatError(`${event.type} is outside an open turn`);
				const root = data["rootCallId"];
				const parent = data["parentCallId"];
				const child = data["subCallId"];
				const known = ptcRoots.get(child);
				if (known !== void 0 && known !== root) throw new SessionFormatError(`${event.type} changes its rootCallId`);
				if (parent !== root && ptcRoots.get(parent) !== root) throw new SessionFormatError(`${event.type} parentCallId does not belong to rootCallId`);
				if (event.type === "tool/code-dispatch-start") {
					if (ptcStarts.has(child)) throw new SessionFormatError("tool/code-dispatch-start repeats subCallId");
					ptcStarts.set(child, {
						root,
						parent,
						name: data["name"],
						arguments: data["arguments"],
						settled: false
					});
				} else {
					const start = ptcStarts.get(child);
					if (start === void 0 || start.settled) throw new SessionFormatError("tool/code-dispatch has no unique start");
					if (start.root !== root || start.parent !== parent || start.name !== data["name"] || !deepEqualJson(start.arguments, data["arguments"])) throw new SessionFormatError("tool/code-dispatch does not match its start");
					start.settled = true;
				}
				ptcRoots.set(child, root);
				break;
			}
			case "llm/retry":
				if (openTurn !== data["turn"] || data["step"] !== (openStep ?? nextStep - 1) || openTurn === null) throw new SessionFormatError("llm/retry does not match the current turn and step");
				if (data["provider"] !== openStepProvider) throw new SessionFormatError("llm/retry provider does not match the open request/header");
				assertRetryChain(retries, data);
				retries.push(event);
				break;
			case "llm/retry-started": {
				const scheduled = retries.find((candidate) => {
					const prior = candidate.data;
					return prior["retryId"] === data["retryId"] && prior["retry"] === data["retry"];
				});
				if (scheduled === void 0) throw new SessionFormatError("llm/retry-started pairs no prior scheduled attempt");
				const prior = scheduled.data;
				if (prior["turn"] !== data["turn"] || prior["step"] !== data["step"]) throw new SessionFormatError("llm/retry-started does not match its scheduled turn and step");
				const key = `${JSON.stringify(data["retryId"])}\0${JSON.stringify(data["retry"])}`;
				if (retryStarts.has(key)) throw new SessionFormatError("llm/retry-started repeats one scheduled attempt");
				retryStarts.add(key);
				break;
			}
			case "session/title":
			case "session/title-llm-request":
				assertTitleSources(artifact.events, event, data, extensions.preservedSourceTitleRequestText !== true);
				break;
			case "command/run": {
				const id = data["commandId"];
				if (commandRuns.has(id)) throw new SessionFormatError(`command/run repeats commandId ${id}`);
				commandRuns.add(id);
				break;
			}
			case "command/done": {
				const id = data["commandId"];
				if (!commandRuns.has(id)) throw new SessionFormatError(`command/done ${id} has no prior command/run`);
				const sourceSeq = data["sourceEventSeq"];
				if (sourceSeq !== void 0) {
					const source = artifact.events[sourceSeq];
					if (data["kind"] !== "success" || source?.type === "command/run" || source?.type === "command/done") throw new SessionFormatError(`command/done ${id} has invalid sourceEventSeq`);
				}
				break;
			}
			case "session-log-deepseek/delivery-accepted":
				if ((data["sessionFormatVersion"] ?? 0) === artifact.header.version) {
					if (!(artifact.header.parentSession !== void 0 && event.seq < artifact.inheritedEventCount) && data["sessionId"] !== artifact.header.id) throw new SessionFormatError("current-generation delivery marker names the wrong Session");
				}
				break;
			case "compaction/start":
				if (openCompaction !== void 0) throw new SessionFormatError("compaction/start overlaps an open compaction");
				assertCompactionTurn(data["turn"], openTurn, "compaction/start");
				openCompaction = {
					id: data["compactionId"],
					...data["sourceCommandId"] === void 0 ? {} : { sourceCommandId: data["sourceCommandId"] },
					turn: data["turn"],
					startSeq: event.seq,
					summarized: false
				};
				break;
			case "compaction/summary":
				assertCompactionOwner(openCompaction, data, "compaction/summary");
				assertCompactionTurn(openCompaction?.turn, openTurn, "compaction/summary");
				if (openCompaction?.summarized === true) throw new SessionFormatError("compaction/summary repeats");
				assertCurrentSurfaceSpan(surface, data, "compaction/summary");
				openCompaction = {
					...openCompaction,
					summarized: true
				};
				break;
			case "compaction/end":
				assertCompactionOwner(openCompaction, data, "compaction/end");
				if (data["turn"] !== openCompaction?.turn) throw new SessionFormatError("compaction/end changes its owner turn");
				assertCompactionTurn(openCompaction?.turn, openTurn, "compaction/end");
				if (data["error"] === void 0 && openCompaction?.summarized !== true) throw new SessionFormatError("successful compaction/end requires one summary");
				openCompaction = void 0;
				break;
			case "compaction/prune":
				assertCurrentSurfaceSpan(surface, data, "compaction/prune");
				break;
			case "user/message": {
				const source = releasedV0Record(data["source"], `user/message ${event.seq} source`);
				if (event["surfaceOp"] !== "append" && source["kind"] === "plugin" && source["plugin"] === "compact") assertCompactionOwner(openCompaction, source, `compaction checkpoint at seq ${event.seq}`);
				break;
			}
			case "session/end-seed":
				openCompaction = void 0;
				break;
		}
	}
}
function inheritedOrphanCompactionStarts(events) {
	const stale = /* @__PURE__ */ new Set();
	let open;
	for (const event of events) if (event.type === "compaction/start") open = event.seq;
	else if (event.type === "compaction/end") open = void 0;
	else if (event.type === "session/end-seed") {
		if (open !== void 0) stale.add(open);
		open = void 0;
	}
	return stale;
}
function assertRetryChain(retries, data) {
	const prior = [...retries].reverse().find((candidate) => {
		const value = candidate.data;
		return value["turn"] === data["turn"] && value["step"] === data["step"] && value["provider"] === data["provider"] && value["policyKey"] === data["policyKey"];
	});
	const expected = (prior?.data?.["retry"] ?? 0) + 1;
	if (data["retry"] !== expected) throw new SessionFormatError(`llm/retry must use retry ${expected}`);
	if (prior !== void 0 && prior.data["retryId"] !== data["retryId"]) throw new SessionFormatError("llm/retry must preserve retryId across one policy chain");
	if (prior === void 0 && retries.some((candidate) => candidate.data["retryId"] === data["retryId"])) throw new SessionFormatError(`llm/retry reuses retryId ${JSON.stringify(data["retryId"])} across policy chains`);
}
function requireOpenStep(event, data, openTurn, openStep) {
	if (data["turn"] !== openTurn || data["step"] !== openStep || openTurn === null || openStep === null) throw new SessionFormatError(`${event.type} does not match an open turn and step`);
}
function assertNoUnresolvedTools(lifecycles, boundary) {
	const unresolved = lifecycles.keys().next().value;
	if (unresolved !== void 0) throw new SessionFormatError(`${boundary} leaves unresolved tool call ${unresolved}`);
}
function isExactToolNotStartedRepair(event, content, error) {
	const message = event.data["message"];
	const callId = message["source"]["callId"];
	const block = content[0];
	const repairContent = block?.["content"];
	return error?.["name"] === "ToolNotStartedError" && error["code"] === "TOOL_NOT_STARTED" && event["sourceEventSeqs"] === void 0 && message["id"] === `interrupted-tool-result-${callId}-${event.seq}` && block?.["isError"] === true && repairContent?.length === 1 && repairContent[0]?.["type"] === "text" && repairContent[0]["text"] === "The tool call was interrupted before the Harness recorded it as started. Retry it if it is still needed.";
}
function applySurface(surface, event) {
	const operation = event["surfaceOp"];
	if (operation === void 0) throw new SessionFormatError(`${event.type} requires a surfaceOp marker`);
	if (operation === "append") return [...surface, event.seq];
	const replace = operation;
	const start = surface.indexOf(replace.start);
	const end = surface.indexOf(replace.end);
	if (start < 0 || end < start) throw new SessionFormatError(`${event.type} replacement range is not on the current surface`);
	const shadowed = surface.slice(start, end + 1);
	const sources = new Set(Array.isArray(event["sourceEventSeqs"]) ? event["sourceEventSeqs"] : []);
	if (shadowed.some((seq) => !sources.has(seq))) throw new SessionFormatError(`${event.type} replacement sourceEventSeqs omit a shadowed surface node`);
	return [
		...surface.slice(0, start),
		event.seq,
		...surface.slice(end + 1)
	];
}
function assertTitleSources(events, event, data, validateFramedText) {
	const seqs = data["messageSeqs"];
	if (event.type === "session/title") {
		const titleSource = releasedV0Record(data["source"], `session/title ${event.seq} source`);
		if (seqs.length === 0 !== (titleSource["kind"] === "user")) throw new SessionFormatError(`session/title ${event.seq} messageSeqs must be empty exactly for a user title`);
	}
	const selected = [];
	for (const seq of seqs) {
		const source = events[seq];
		if (source?.type !== "user/message") throw new SessionFormatError(`${event.type} ${event.seq} messageSeqs must cite earlier human user/message events`);
		const sourceData = releasedV0Record(source.data, `${source.type} ${seq} data`);
		if (releasedV0Record(sourceData["source"], `${source.type} ${seq} source`)["kind"] !== "user") throw new SessionFormatError(`${event.type} ${event.seq} messageSeqs must cite earlier human user/message events`);
		const content = sourceData["content"];
		selected.push({
			seq,
			text: content.flatMap((block) => block["type"] === "text" && typeof block["text"] === "string" ? [block["text"]] : []).join("\n")
		});
	}
	if (event.type === "session/title-llm-request") {
		const messages = data["messages"];
		const expected = `Generate the session title from this JSON array of human messages:\n${JSON.stringify(selected)}`;
		const message = messages[0];
		const content = message?.["content"];
		const source = message === void 0 ? void 0 : releasedV0Record(message["source"], "session/title-llm-request message source");
		if (messages.length !== 1 || message?.["role"] !== "user" || content?.length !== 1 || source?.["kind"] !== "plugin" || source["plugin"] !== "dsh-session-title-llm") throw new SessionFormatError("session/title-llm-request messages do not represent messageSeqs");
		const framed = content[0];
		if (framed === void 0 || framed["type"] !== "text" || validateFramedText && framed["text"] !== expected) throw new SessionFormatError("session/title-llm-request messages do not represent messageSeqs");
	}
}
function assertCompactionOwner(open, data, type) {
	if (open === void 0 || data["compactionId"] !== open.id || data["sourceCommandId"] !== open.sourceCommandId) throw new SessionFormatError(`${type} has no matching compaction/start`);
}
function assertCompactionTurn(owner, openTurn, type) {
	if (owner === null ? openTurn !== null : owner !== openTurn) throw new SessionFormatError(`${type} does not match the open turn`);
}
function assertCurrentSurfaceSpan(surface, data, type) {
	const range = data["shadowedRange"];
	const seqs = data["shadowedSeqs"];
	const start = surface.indexOf(range.start);
	const end = surface.indexOf(range.end);
	const expected = start < 0 || end < start ? [] : surface.slice(start, end + 1);
	if (expected.length !== seqs.length || expected.some((seq, index) => seq !== seqs[index])) throw new SessionFormatError(`${type} shadowedSeqs do not name an exact current surface span`);
}
//#endregion
export { RELEASED_V0_EVENT_DISPOSITIONS, RELEASED_V0_EVENT_TYPES, assertReleasedArtifactRelationships, assertReleasedEventPayload, assertReleasedPayloadSemantics, assertReleasedSurfaceMetadata, assertReleasedV1Header, defineReleasedPayloadDisposition, isReleasedAssistantChunkRun, releasedV0SessionFormatCodec, releasedV1SessionFormatCodec, restoreReleasedV1Artifact, sessionFormatV0ToV1 };
