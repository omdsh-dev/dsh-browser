import type * as core from "./core.cjs";
import type { SomeType } from "./schemas.cjs";
/** Sentinel value returned by the compiled fast path when validation fails. Internal. */
export declare const INVALID: unique symbol;
export type INVALID = typeof INVALID;
interface CompileFnOptions {
    debug?: boolean | undefined;
    /** Emit a validator instead of a parser: skip building the output value where nothing reads it. */
    assertOnly?: boolean | undefined;
}
type CompiledFn<T> = ((input: unknown) => T | INVALID) & {
    code?: string | undefined;
};
/** Raised when the schema contains async refinements or transforms. Surfaces only under `compile(schema, { strict: true })`. */
export declare class ZodCompileAsyncError extends Error {
    constructor(message?: string);
}
/**
 * Raised when the schema contains a feature whose semantics the fast path
 * can't fully model. Both the shim in `zod/compile` and the default
 * `compile()` fall back to the runtime parser for that schema; only
 * `compile(schema, { strict: true })` lets it surface.
 */
export declare class ZodCompileUnsupportedError extends Error {
    /** Whether a container may absorb this refusal by running the child through the runtime (see `compileChild`). False when running only that node on the runtime is not equivalent to running the whole parse there — a runtime island gets no parse context, so a node that *consumes* issues rather than propagating them would finalize them against the wrong error map and still succeed. */
    readonly islandable: boolean;
    constructor(feature: string, islandable?: boolean);
}
export interface CompileOptions {
    /** Throw the refusal instead of returning the schema uncompiled. */
    strict?: boolean | undefined;
}
/**
 * AOT-compile a Zod schema. Returns a clone whose `_zod.run` calls a generated
 * fast path first and falls back to the original runtime parser on failure.
 *
 * - Forward direction only. Backward (encode), async, and `skipChecks` paths
 *   bypass the fast path and use the runtime directly.
 * - Never throws. A schema the fast path can't model is returned unchanged and
 *   keeps using the runtime parser. Pass `{ strict: true }` to get the refusal
 *   as a thrown `ZodCompileUnsupportedError` / `ZodCompileAsyncError` instead.
 * - The original schema is unchanged. The clone shares children by reference.
 */
export declare function compile<T extends SomeType>(schema: T, options?: CompileOptions): T;
/**
 * Generate the standalone compiled function: a parser by default, a validator under
 * `assertOnly`. Returns either the parsed value, `true` where nothing reads the output,
 * or the `INVALID` sentinel. Internal — consumers should use `compile()`.
 */
export declare function compileFn<T extends SomeType>(schema: T, options?: CompileFnOptions): CompiledFn<core.output<T>>;
export {};
