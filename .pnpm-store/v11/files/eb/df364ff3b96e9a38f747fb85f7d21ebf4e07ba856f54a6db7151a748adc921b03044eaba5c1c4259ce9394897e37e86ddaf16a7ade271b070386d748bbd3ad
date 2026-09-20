// deno-fmt-ignore-file
import { ExtendsLeft } from './extends_left.mjs';
import { EvaluateTemplateLiteral } from '../engine/evaluate/evaluate.mjs';
export function ExtendsTemplateLiteral(inferred, left, right) {
    const evaluated = EvaluateTemplateLiteral(left);
    return ExtendsLeft(inferred, evaluated, right);
}
