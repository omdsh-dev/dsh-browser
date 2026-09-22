import { type TSchema } from '../../types/schema.mjs';
import { type TFromType } from './from_type.mjs';
import { type TEvaluateDependent } from '../evaluate/evaluate.mjs';
export type TFromDependent<If extends TSchema, Then extends TSchema, Else extends TSchema, Evaluated extends TSchema = TEvaluateDependent<If, Then, Else>, Result extends string[] = TFromType<Evaluated>> = Result;
export declare function FromDependent<If extends TSchema, Then extends TSchema, Else extends TSchema>(if_: If, then_: Then, else_: Else): TFromDependent<If, Then, Else>;
