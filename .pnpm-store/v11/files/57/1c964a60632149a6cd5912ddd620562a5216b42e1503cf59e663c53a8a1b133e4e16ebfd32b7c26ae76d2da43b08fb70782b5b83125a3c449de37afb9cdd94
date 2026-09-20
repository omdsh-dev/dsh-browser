import { type TSchema } from '../types/schema.mjs';
import { type TProperties } from '../types/properties.mjs';
import { type TExtendsLeft } from './extends_left.mjs';
import { type TEvaluateTemplateLiteral } from '../engine/evaluate/evaluate.mjs';
export type TExtendsTemplateLiteral<Inferred extends TProperties, Pattern extends string, Right extends TSchema, Evaluated extends TSchema = TEvaluateTemplateLiteral<Pattern>> = TExtendsLeft<Inferred, Evaluated, Right>;
export declare function ExtendsTemplateLiteral<Inferred extends TProperties, Pattern extends string, Right extends TSchema>(inferred: Inferred, left: Pattern, right: Right): TExtendsTemplateLiteral<Inferred, Pattern, Right>;
