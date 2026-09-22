import type { EndpointObjectHeaders, ParameterObject } from "@smithy/types";
import type { Expression, FunctionArgv } from "../types/shared";
/**
 * @internal
 */
type BddCondition = [string, FunctionArgv] | [string, FunctionArgv, string];
/**
 * @internal
 */
type BddResult = [-1] | [-1, Expression] | [string, Record<string, ParameterObject>, EndpointObjectHeaders] | [string, Record<string, ParameterObject>];
/**
 * @internal
 */
export declare class BinaryDecisionDiagram {
    nodes: Int32Array;
    root: number;
    conditions: BddCondition[];
    results: BddResult[];
    private constructor();
    static from(bdd: Int32Array, root: number, conditions: BddCondition[] | any[], results: BddResult[] | any[]): BinaryDecisionDiagram;
}
export {};
