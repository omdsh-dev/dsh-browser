import { type TSchema } from '../../types/schema.mjs';
import { type TMappingType, type TMappingFunc } from './mapping.mjs';
import { type TFromType } from './from_type.mjs';
import { type TEvaluateTemplateLiteral } from '../evaluate/index.mjs';
export type TFromTemplateLiteral<Mapping extends TMappingType, Pattern extends string, Evaluated extends TSchema = TEvaluateTemplateLiteral<Pattern>, Result extends TSchema = TFromType<Mapping, Evaluated>> = Result;
export declare function FromTemplateLiteral(mapping: TMappingFunc, pattern: string): TSchema;
