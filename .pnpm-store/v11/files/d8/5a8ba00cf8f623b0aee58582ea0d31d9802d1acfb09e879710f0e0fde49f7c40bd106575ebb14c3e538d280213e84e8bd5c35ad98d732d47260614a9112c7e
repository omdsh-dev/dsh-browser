import { type TSchema } from '../../types/schema.mjs';
import { type TFromType } from './from_type.mjs';
import { type TEvaluateIntersect } from '../evaluate/evaluate.mjs';
export type TFromIntersect<Types extends TSchema[], Evaluated extends TSchema = TEvaluateIntersect<Types>, Result extends TSchema = TFromType<Evaluated>> = Result;
export declare function FromIntersect<Types extends TSchema[]>(types: [...Types]): TFromIntersect<Types>;
