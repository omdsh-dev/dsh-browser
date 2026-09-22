import { type TSchema } from '../../types/schema.mjs';
import { type TCompare, type TCompareResult } from '../evaluate/compare.mjs';
type TComparer<Left extends TSchema, Right extends TSchema, CompareResult extends TCompareResult = TCompare<Left, Right>, Result extends 0 | 1 = (CompareResult extends 'right-inside' ? 1 : CompareResult extends 'disjoint' ? 1 : 0)> = Result;
type TInsert<Type extends TSchema, Types extends TSchema[], Result extends TSchema[] = []> = (Types extends [infer Left extends TSchema, ...infer Right extends TSchema[]] ? TComparer<Type, Left> extends 1 ? TInsert<Type, Right, [...Result, Left]> : [...Result, Type, ...Types] : [...Result, Type]);
type TSort<Types extends TSchema[], Result extends TSchema[] = []> = (Types extends [infer Left extends TSchema, ...infer Right extends TSchema[]] ? TSort<Right, TInsert<Left, Result>> : Result);
/**
 * Priority sorts types in sequence of narrowest to broadest using an Insertion Sort
 * algorithm. This function is typically used to sequence types for union variant
 * checks to ensure that values are checked against the most narrow types before
 * the broadest, which in turn helps ensure order-independent Union checking.
 */
export type TPriority<Types extends TSchema[], Result extends TSchema[] = TSort<Types>> = Result;
/**
 * Priority sorts types in sequence of narrowest to broadest using an Insertion Sort
 * algorithm. This function is typically used to sequence types for union variant
 * checks to ensure that values are checked against the most narrow types before
 * the broadest, which in turn helps ensure order-independent Union checking.
 */
export declare function Priority<Types extends TSchema[]>(types: [...Types]): TPriority<Types>;
export {};
