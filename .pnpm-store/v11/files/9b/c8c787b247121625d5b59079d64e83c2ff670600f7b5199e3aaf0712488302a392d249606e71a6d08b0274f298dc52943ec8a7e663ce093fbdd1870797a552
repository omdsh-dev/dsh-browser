import type { SessionFormatArtifact, SessionFormatEvent, SessionFormatHeader, SessionFormatJsonValue } from '@deepseek-ai/dsh-session-format';
/**
 * Validate the logical header shared by released v0 and v1.
 * @param header - detached logical header.
 * @param version - exact expected generation.
 */
export declare function assertReleasedSessionFormatHeader(header: SessionFormatHeader, version: 0 | 1): void;
/**
 * Validate one released-v1 logical header.
 * @param header - detached logical header.
 */
export declare function assertReleasedV1Header(header: SessionFormatHeader): void;
/**
 * Restore v1 against the installed build's ordinary event vocabulary without freezing payload additions.
 * @param artifact - vocabulary-neutral released-v1 physical decode.
 * @param knownEventTypes - event types understood by the installed current Session package.
 * @returns the same validated detached artifact.
 */
export declare function restoreReleasedV1Artifact(artifact: SessionFormatArtifact, knownEventTypes: ReadonlySet<string>): SessionFormatArtifact;
/**
 * Validate released-v0/v1 artifact coordinates under an explicit vocabulary policy.
 * @param artifact - logical artifact to validate.
 * @param allowLegacySteering - whether to accept the retired steering event name.
 * @param knownEventTypes - installed event vocabulary, when vocabulary-aware.
 * @param vocabularyNeutral - whether unknown event types remain opaque.
 * @param frozenEnvelope - whether event envelopes must already be frozen.
 */
export declare function assertReleasedArtifactCoordinates(artifact: SessionFormatArtifact, allowLegacySteering: boolean, knownEventTypes?: ReadonlySet<string>, vocabularyNeutral?: boolean, frozenEnvelope?: boolean): void;
/**
 * Validate shared-layout surface references for one released generation.
 * @param record - exact event envelope.
 * @param seq - event position used for earlier-reference checks.
 * @param type - surface event type used in diagnostics.
 * @param assistantSources - whether this generation admits empty Assistant chunk provenance.
 */
export declare function assertReleasedSurfaceMetadata(record: Record<string, SessionFormatJsonValue>, seq: number, type: string, assistantSources: 'allow-empty-assistant' | 'forbid-assistant'): void;
/**
 * Validate one exact known payload after legacy normalization.
 * @param event - known event to validate.
 * @param version - payload generation controlling versioned members.
 */
export declare function assertReleasedEventPayload(event: SessionFormatEvent, version: 0 | 1): void;
//# sourceMappingURL=validation.d.ts.map