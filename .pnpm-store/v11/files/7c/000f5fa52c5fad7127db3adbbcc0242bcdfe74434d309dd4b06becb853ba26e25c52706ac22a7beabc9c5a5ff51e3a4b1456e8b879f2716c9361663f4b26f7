import type { SessionFormatArtifact } from '@deepseek-ai/dsh-session-format';
/** Relationship roles added by a later format while reusing the released validator. */
export interface ReleasedRelationshipExtensions {
    /** Event types that must occur inside the current open step. */
    readonly stepEvents?: ReadonlySet<string>;
    /** Title-request model input was source-validated and preserved across sequence remapping. */
    readonly preservedSourceTitleRequestText?: true;
    /** Admit the released resume pattern whose next-turn inbox insert omitted the prior turn/end. */
    readonly legacyInterruptedTurnRestart?: true;
}
/**
 * Validate cross-event relationships required to construct one current Session safely.
 * @param artifact - complete normalized v0 or exact current v1 artifact.
 * @param extensions - later-generation event roles interpreted by the calling format owner.
 */
export declare function assertReleasedArtifactRelationships(artifact: SessionFormatArtifact, extensions?: ReleasedRelationshipExtensions): void;
//# sourceMappingURL=relationships.d.ts.map