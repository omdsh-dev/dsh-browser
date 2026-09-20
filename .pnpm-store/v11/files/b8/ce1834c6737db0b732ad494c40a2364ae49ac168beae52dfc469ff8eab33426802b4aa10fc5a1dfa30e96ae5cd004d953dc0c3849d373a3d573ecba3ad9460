import type { SessionFormatEventRun, SessionFormatHeader, SessionFormatJsonObject, SessionFormatMigrationContext, SessionFormatRecovery } from '@deepseek-ai/dsh-session-format';
/** A released packed Assistant row retained until v1-to-v2 embeds its compact stream. */
export interface ReleasedAssistantChunkRun extends SessionFormatEventRun {
    readonly runType: 'released-assistant-chunks';
    readonly turn: number;
    readonly step: number;
    readonly lastSeq: number;
    readonly lastTime: number;
    readonly stream: SessionFormatJsonObject;
}
/**
 * Test whether a compact migration item is a released packed Assistant row.
 * @param run - compact migration item to classify.
 * @returns whether the item carries the released Assistant chunk representation.
 */
export declare function isReleasedAssistantChunkRun(run: SessionFormatEventRun): run is ReleasedAssistantChunkRun;
/** Frozen physical JSON codec for the released v0 layout. */
export declare const releasedV0SessionFormatCodec: Readonly<{
    version: 0 | 1;
    decodeHeader: (value: unknown) => SessionFormatHeader;
    createDecoder(headerValue: unknown, recovery: SessionFormatRecovery): {
        header: SessionFormatHeader;
        headerInheritedEventCount: number;
        decodeRow: (rowValue: unknown, context: SessionFormatMigrationContext) => void;
        finish(_context: SessionFormatMigrationContext): number;
    };
}>;
/** Frozen physical JSON codec for the shared-layout released v1 format. */
export declare const releasedV1SessionFormatCodec: Readonly<{
    version: 0 | 1;
    decodeHeader: (value: unknown) => SessionFormatHeader;
    createDecoder(headerValue: unknown, recovery: SessionFormatRecovery): {
        header: SessionFormatHeader;
        headerInheritedEventCount: number;
        decodeRow: (rowValue: unknown, context: SessionFormatMigrationContext) => void;
        finish(_context: SessionFormatMigrationContext): number;
    };
}>;
//# sourceMappingURL=codec.d.ts.map