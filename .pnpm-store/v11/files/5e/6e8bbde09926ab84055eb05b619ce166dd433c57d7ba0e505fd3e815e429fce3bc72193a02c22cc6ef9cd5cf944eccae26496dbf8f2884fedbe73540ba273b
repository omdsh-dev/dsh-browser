import { type TSchema } from '../../types/schema.mjs';
import { type TFromType } from './from_type.mjs';
import { type TEvaluateTemplateLiteral } from '../evaluate/evaluate.mjs';
export type TFromTemplateLiteral<Pattern extends string, Evaluated extends TSchema = TEvaluateTemplateLiteral<Pattern>, Result extends string[] = TFromType<Evaluated>> = Result;
export declare function FromTemplateLiteral<Pattern extends string>(pattern: Pattern): TFromTemplateLiteral<Pattern>;
