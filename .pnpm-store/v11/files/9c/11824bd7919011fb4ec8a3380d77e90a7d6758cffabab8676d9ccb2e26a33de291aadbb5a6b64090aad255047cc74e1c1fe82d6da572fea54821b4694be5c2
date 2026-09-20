import { type TSchema } from '../../types/schema.mjs';
import { type TTuple } from '../../types/tuple.mjs';
import { type TAddImmutable } from '../../action/_add_immutable.mjs';
export type TFromTuple<Types extends TSchema[], Result extends TSchema = TAddImmutable<TTuple<Types>>> = Result;
export declare function FromTuple<Types extends TSchema[]>(types: [...Types]): TFromTuple<Types>;
