// deno-lint-ignore-file ban-types
// deno-fmt-ignore-file
import { IsUnion } from '../../types/union.mjs';
import { Extends, ExtendsResult } from '../../extends/index.mjs';
import { EvaluateType } from '../evaluate/evaluate.mjs';
import { EvaluateUnion } from '../evaluate/evaluate.mjs';
function ExtractType(left, right) {
    const check = Extends({}, left, right);
    const result = ExtendsResult.IsExtendsTrueLike(check) ? [left] : [];
    return result;
}
function ExtractUnion(types, right) {
    return types.reduce((result, head) => {
        return [...result, ...ExtractType(head, right)];
    }, []);
}
export function ExtractOperation(left, right) {
    const evaluated = EvaluateType(left);
    const canonical = IsUnion(evaluated) ? evaluated.anyOf : [evaluated];
    const remaining = ExtractUnion(canonical, right);
    const result = EvaluateUnion(remaining);
    return result;
}
