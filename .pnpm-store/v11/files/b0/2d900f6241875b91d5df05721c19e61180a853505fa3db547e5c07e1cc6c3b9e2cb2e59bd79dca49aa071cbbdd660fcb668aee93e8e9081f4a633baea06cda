import { type TSchema } from '../../types/schema.mjs';
import { type TArray } from '../../types/array.mjs';
import { type TAddImmutable } from '../../action/_add_immutable.mjs';
export type TFromArray<Type extends TSchema, Result extends TSchema = TAddImmutable<TArray<Type>>> = Result;
export declare function FromArray<Type extends TSchema>(type: Type): TFromArray<Type>;
