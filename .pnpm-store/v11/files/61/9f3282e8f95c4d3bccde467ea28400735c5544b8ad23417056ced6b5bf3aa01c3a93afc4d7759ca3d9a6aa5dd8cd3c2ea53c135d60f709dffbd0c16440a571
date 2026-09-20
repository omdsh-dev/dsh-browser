// deno-fmt-ignore-file
import { FromType } from './from_type.mjs';
import { EvaluateEnum } from '../evaluate/evaluate.mjs';
export function FromEnum(values) {
    const evaluated = EvaluateEnum(values);
    const result = FromType(evaluated);
    return result;
}
