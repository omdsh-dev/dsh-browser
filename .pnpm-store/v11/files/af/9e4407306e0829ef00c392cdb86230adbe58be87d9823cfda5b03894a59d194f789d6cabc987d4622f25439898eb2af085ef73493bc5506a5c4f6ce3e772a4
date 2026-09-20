import { type TLocalizedValidationError } from '../error/index.mjs';
import { type StaticDecode, type StaticEncode, type TProperties, type TSchema } from '../type/index.mjs';
export declare class Validator<Context extends TProperties = TProperties, Type extends TSchema = TSchema, Encode extends unknown = StaticEncode<Type, Context>, Decode extends unknown = StaticDecode<Type, Context>> {
    private readonly hasCodec;
    private readonly buildResult;
    private readonly evaluateResult;
    /** Constructs a Validator. */
    constructor(context: Context, type: Type);
    /** Returns true if this Validator is using JIT acceleration. */
    IsAccelerated(): boolean;
    /** Returns the Context for this validator. */
    Context(): Context;
    /** Returns the underlying Type used to construct this Validator. */
    Type(): Type;
    /** Returns the generated code for this validator. */
    Code(): string;
    /** Performs a type-guard check on the provided value. */
    Check(value: unknown): value is Encode;
    /** Validates a value and returns it. Will throw if invalid. */
    Parse(value: unknown): Encode;
    /** Inspects a value and returns a detailed list of validation errors. */
    Errors(value: unknown): TLocalizedValidationError[];
    /** Cleans a value using the Validator type. */
    Clean(value: unknown): unknown;
    /** Converts a value using the Validator type. */
    Convert(value: unknown): unknown;
    /** Creates a value using the Validator type. */
    Create(): Encode;
    /** Creates defaults using the Validator type. */
    Default(value: unknown): unknown;
    /** Decodes a value */
    Decode(value: unknown): Decode;
    /** Encodes a value */
    Encode(value: unknown): Encode;
}
