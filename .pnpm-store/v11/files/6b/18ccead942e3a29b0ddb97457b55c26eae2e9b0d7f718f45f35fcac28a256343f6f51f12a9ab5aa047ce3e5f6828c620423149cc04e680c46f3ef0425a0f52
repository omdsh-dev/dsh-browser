import { type TProperties, type TPropertyKeys } from '../../types/properties.mjs';
import { type TCyclicCheck } from './check.mjs';
type TResolveCandidateKeys<Context extends TProperties, Keys extends (keyof Context)[], Result extends (keyof Context)[] = []> = (Keys extends [infer Left extends keyof Context, ...infer Right extends (keyof Context)[]] ? TCyclicCheck<[Left], Context, Context[Left]> extends true ? TResolveCandidateKeys<Context, Right, [...Result, Left]> : TResolveCandidateKeys<Context, Right, Result> : Result);
/** Returns keys for context types that need to be transformed to TCyclic. */
export type TCyclicCandidates<Context extends TProperties, Keys extends (keyof Context)[] = TPropertyKeys<Context>, Result extends (keyof Context)[] = TResolveCandidateKeys<Context, Keys>> = Result;
/** Returns keys for context types that need to be transformed to TCyclic. */
export declare function CyclicCandidates<Context extends TProperties>(context: Context): TCyclicCandidates<Context>;
export {};
