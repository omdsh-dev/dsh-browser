import { type TSchema } from '../types/schema.mjs';
import { type TProperties } from '../types/properties.mjs';
import { type TEnumValue } from '../types/enum.mjs';
import { type TExtendsLeft } from './extends_left.mjs';
import { type TEvaluateEnum } from '../engine/evaluate/evaluate.mjs';
export type TExtendsEnum<Inferred extends TProperties, Left extends TEnumValue[], Right extends TSchema, Evaluated extends TSchema = TEvaluateEnum<Left>> = TExtendsLeft<Inferred, Evaluated, Right>;
export declare function ExtendsEnum<Inferred extends TProperties, Left extends TEnumValue[], Right extends TSchema>(inferred: Inferred, left: Left, right: Right): TExtendsEnum<Inferred, Left, Right>;
