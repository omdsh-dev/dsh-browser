// deno-fmt-ignore-file
import { Guard } from '../../../guard/index.mjs';
import { Literal, IsLiteral } from '../../types/literal.mjs';
import { IsEnum } from '../../types/enum.mjs';
import { IsTemplateLiteral } from '../../types/template_literal.mjs';
import { IsUnion } from '../../types/union.mjs';
import { EvaluateEnum } from '../evaluate/evaluate.mjs';
import { EvaluateTemplateLiteral } from '../evaluate/evaluate.mjs';
function FromTemplateLiteral(pattern) {
    const evaluated = EvaluateTemplateLiteral(pattern);
    const result = FromType(evaluated);
    return result;
}
function FromUnion(types) {
    return types.reduce((result, left) => {
        return [...result, ...FromType(left)];
    }, []);
}
function FromEnum(values) {
    const evaluated = EvaluateEnum(values);
    const result = FromType(evaluated);
    return result;
}
function FromLiteral(value) {
    const result = Guard.IsNumber(value) ? [Literal(`${value}`)] : [Literal(value)];
    return result;
}
function FromType(type) {
    const result = (IsEnum(type) ? FromEnum(type.enum) :
        IsLiteral(type) ? FromLiteral(type.const) :
            IsTemplateLiteral(type) ? FromTemplateLiteral(type.pattern) :
                IsUnion(type) ? FromUnion(type.anyOf) :
                    [type]);
    return result;
}
export function MappedVariants(type) {
    const result = FromType(type);
    return result;
}
