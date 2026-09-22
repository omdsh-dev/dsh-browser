// deno-fmt-ignore-file
import { FromKey } from './from_key.mjs';
import { EvaluateEnum } from '../evaluate/evaluate.mjs';
export function FromEnumKey(values, value) {
    const unionKey = EvaluateEnum(values);
    const result = FromKey(unionKey, value);
    return result;
}
