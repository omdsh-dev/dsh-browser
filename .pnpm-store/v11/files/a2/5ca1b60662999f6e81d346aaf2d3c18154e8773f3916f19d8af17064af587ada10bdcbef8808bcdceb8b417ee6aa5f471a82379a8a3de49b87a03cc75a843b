import { type TSchema } from '../../types/schema.mjs';
import { type TEnumValue } from '../../types/enum.mjs';
import { type TFromType } from './from_type.mjs';
import { type TEvaluateEnum } from '../evaluate/evaluate.mjs';
export type TFromEnum<Values extends TEnumValue[], Evaluated extends TSchema = TEvaluateEnum<Values>, Result extends string[] = TFromType<Evaluated>> = Result;
export declare function FromEnum<Values extends TEnumValue[]>(values: [...Values]): TFromEnum<Values>;
