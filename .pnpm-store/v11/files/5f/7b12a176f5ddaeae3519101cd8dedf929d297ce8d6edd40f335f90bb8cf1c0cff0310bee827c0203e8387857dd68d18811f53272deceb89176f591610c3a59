// deno-fmt-ignore-file
import { Guard } from '../../guard/index.mjs';
import { Memory } from '../../system/memory/index.mjs';
import { IsAny } from '../types/any.mjs';
import { IsDependent } from '../types/dependent.mjs';
import { IsEnum } from '../types/enum.mjs';
import { IsInfer } from '../types/infer.mjs';
import { IsIntersect } from '../types/intersect.mjs';
import { IsTemplateLiteral } from '../types/template_literal.mjs';
import { IsUnion } from '../types/union.mjs';
import { IsUnknown } from '../types/unknown.mjs';
import { ExtendsLeft } from './extends_left.mjs';
import * as Result from './result.mjs';
import { EvaluateEnum } from '../engine/evaluate/evaluate.mjs';
import { EvaluateTemplateLiteral } from '../engine/evaluate/evaluate.mjs';
function ExtendsRightInfer(inferred, name, left, right) {
    return Result.Match(ExtendsLeft(inferred, left, right), checkInferred => Result.ExtendsTrue(Memory.Assign(Memory.Assign(inferred, checkInferred), { [name]: left })), () => Result.ExtendsFalse());
}
function ExtendsRightAny(inferred, _left) {
    return Result.ExtendsTrue(inferred);
}
function ExtendsRightDependent(inferred, left, if_, then_, else_) {
    return Result.Match(ExtendsLeft(inferred, left, if_), inferred => Result.Match(ExtendsLeft(inferred, left, then_), inferred => Result.ExtendsTrue(inferred), () => Result.ExtendsFalse()), () => Result.Match(ExtendsLeft(inferred, left, else_), inferred => Result.ExtendsTrue(inferred), () => Result.ExtendsFalse()));
}
function ExtendsRightEnum(inferred, left, right) {
    const evaluated = EvaluateEnum(right);
    return ExtendsLeft(inferred, left, evaluated);
}
function ExtendsRightIntersect(inferred, left, right) {
    return Guard.ShiftLeft(right, (head, tail) => Result.Match(ExtendsLeft(inferred, left, head), inferred => ExtendsRightIntersect(inferred, left, tail), () => Result.ExtendsFalse()), () => Result.ExtendsTrue(inferred));
}
function ExtendsRightTemplateLiteral(inferred, left, right) {
    const evaluated = EvaluateTemplateLiteral(right);
    return ExtendsLeft(inferred, left, evaluated);
}
function ExtendsRightUnion(inferred, left, right) {
    return Guard.ShiftLeft(right, (head, tail) => Result.Match(ExtendsLeft(inferred, left, head), inferred => Result.ExtendsTrue(inferred), () => ExtendsRightUnion(inferred, left, tail)), () => Result.ExtendsFalse());
}
export function ExtendsRight(inferred, left, right) {
    return (IsAny(right) ? ExtendsRightAny(inferred, left) :
        IsDependent(right) ? ExtendsRightDependent(inferred, left, right.if, right.then, right.else) :
            IsEnum(right) ? ExtendsRightEnum(inferred, left, right.enum) :
                IsInfer(right) ? ExtendsRightInfer(inferred, right.name, left, right.extends) :
                    IsIntersect(right) ? ExtendsRightIntersect(inferred, left, right.allOf) :
                        IsTemplateLiteral(right) ? ExtendsRightTemplateLiteral(inferred, left, right.pattern) :
                            IsUnion(right) ? ExtendsRightUnion(inferred, left, right.anyOf) :
                                IsUnknown(right) ? Result.ExtendsTrue(inferred) :
                                    Result.ExtendsFalse());
}
