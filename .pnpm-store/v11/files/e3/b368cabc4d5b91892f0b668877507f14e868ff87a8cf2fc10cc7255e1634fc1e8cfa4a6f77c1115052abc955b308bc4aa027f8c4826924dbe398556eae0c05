// deno-fmt-ignore-file
import { ExtendsLeft } from './extends_left.mjs';
import { EvaluateEnum } from '../engine/evaluate/evaluate.mjs';
export function ExtendsEnum(inferred, left, right) {
    const evaluated = EvaluateEnum(left);
    return ExtendsLeft(inferred, evaluated, right);
}
