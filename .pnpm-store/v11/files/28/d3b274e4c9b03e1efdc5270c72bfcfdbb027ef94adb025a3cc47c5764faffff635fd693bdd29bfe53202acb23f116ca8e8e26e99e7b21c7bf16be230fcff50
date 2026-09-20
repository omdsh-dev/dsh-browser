import type { SessionFormatArtifact, SessionFormatRecovery } from '@deepseek-ai/dsh-session-format';
/**
 * Restore released v0 rows through the production decoder and v0-to-v1 stage.
 * @param header - released v0 physical header.
 * @param rows - released v0 physical rows.
 * @param recovery - strict or recoverable row policy.
 * @returns the transformed released v1 artifact.
 */
export declare function restoreV0ToV1(header: unknown, rows: readonly unknown[], recovery?: SessionFormatRecovery): SessionFormatArtifact;
/**
 * Restore released v1 rows through the production decoder and current collector.
 * @param header - released v1 physical header.
 * @param rows - released v1 physical rows.
 * @param recovery - strict or recoverable row policy.
 * @returns the restored released v1 artifact.
 */
export declare function restoreV1(header: unknown, rows: readonly unknown[], recovery?: SessionFormatRecovery): SessionFormatArtifact;
//# sourceMappingURL=restore.d.ts.map