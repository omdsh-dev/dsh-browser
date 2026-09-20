import { type TProperties } from '../types/properties.mjs';
import { type TSchema } from '../types/schema.mjs';
import { type TExtendsLeft } from './extends_left.mjs';
import * as Result from './result.mjs';
export type TExtendsDependent<Inferred extends TProperties, If extends TSchema, Then extends TSchema, Else extends TSchema, Right extends TSchema> = (TExtendsLeft<Inferred, If, Right> extends Result.TExtendsTrueLike<infer Inferred extends TProperties> ? TExtendsLeft<Inferred, Then, Right> : TExtendsLeft<Inferred, Else, Right>);
export declare function ExtendsDependent<Inferred extends TProperties, If extends TSchema, Then extends TSchema, Else extends TSchema, Right extends TSchema>(inferred: Inferred, if_: If, then_: Then, else_: Else, right: Right): TExtendsDependent<Inferred, If, Then, Else, Right>;
