// deno-fmt-ignore-file
import { FromType } from './from_type.mjs';
import { EvaluateTemplateLiteral } from '../evaluate/index.mjs';
export function FromTemplateLiteral(mapping, pattern) {
    const evaluated = EvaluateTemplateLiteral(pattern);
    const result = FromType(mapping, evaluated);
    return result;
}
