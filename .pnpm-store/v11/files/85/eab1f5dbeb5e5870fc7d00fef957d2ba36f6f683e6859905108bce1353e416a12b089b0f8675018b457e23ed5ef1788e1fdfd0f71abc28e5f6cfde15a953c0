import type { SessionFormatArtifact, SessionFormatHeader, SessionFormatJsonObject, SessionFormatJsonValue } from '@deepseek-ai/dsh-session-format';
/**
 * Validate the exact logical header written by released v2.
 * @param header - decoded released-v2 Session header.
 * @throws {SessionFormatError} when the header is not an exact released-v2 value.
 */
export declare function assertReleasedV2Header(header: SessionFormatHeader): void;
/**
 * Require one released-v2 value to be a JSON object.
 * @param value - value to narrow.
 * @param label - diagnostic subject.
 * @returns the narrowed object.
 */
export declare function releasedV2Record(value: SessionFormatJsonValue | undefined, label: string): SessionFormatJsonObject;
/**
 * Require one released-v2 object to contain exactly the admitted keys.
 * @param value - object to inspect.
 * @param required - keys that must be present.
 * @param optional - additional keys that may be present.
 * @param label - diagnostic subject.
 */
export declare function assertReleasedV2Keys(value: SessionFormatJsonObject, required: readonly string[], optional: readonly string[], label: string): void;
/**
 * Restore and validate one decoded released-v2 artifact.
 * @param artifact - detached vocabulary-restored artifact.
 * @param knownEventTypes - event types understood by the installed current Session package.
 * @param relationshipHeaderVersion - logical generation whose version-sensitive relationships are checked.
 * @returns the same validated artifact.
 */
export declare function restoreReleasedV2Artifact(artifact: SessionFormatArtifact, knownEventTypes: ReadonlySet<string>, relationshipHeaderVersion?: number): SessionFormatArtifact;
/**
 * Validate the released-v2 physical envelope without interpreting event vocabulary.
 * @param artifact - released-v2 physical artifact.
 */
export declare function assertReleasedV2PhysicalArtifact(artifact: SessionFormatArtifact): void;
//# sourceMappingURL=validation.d.ts.map