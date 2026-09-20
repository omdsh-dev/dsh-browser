// deno-fmt-ignore-file
import { FromType } from './from_type.mjs';
import { EvaluateDependent } from '../evaluate/evaluate.mjs';
export function FromDependent(if_, then_, else_) {
    const evaluated = EvaluateDependent(if_, then_, else_);
    const result = FromType(evaluated);
    return result;
}
