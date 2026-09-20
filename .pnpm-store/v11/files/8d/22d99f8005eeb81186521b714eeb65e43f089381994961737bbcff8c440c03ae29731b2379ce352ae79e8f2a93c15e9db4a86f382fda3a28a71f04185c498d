// deno-fmt-ignore-file
import { FromType } from './from_type.mjs';
import { EvaluateTemplateLiteral } from '../evaluate/evaluate.mjs';
export function FromTemplateLiteral(pattern) {
    const evaluated = EvaluateTemplateLiteral(pattern);
    const result = FromType(evaluated);
    return result;
}
