// deno-fmt-ignore-file
import { ExtendsAny } from './any.mjs';
import { ExtendsArray } from './array.mjs';
import { ExtendsBigInt } from './bigint.mjs';
import { ExtendsBoolean } from './boolean.mjs';
import { ExtendsConstructor } from './constructor.mjs';
import { ExtendsDependent } from './dependent.mjs';
import { ExtendsEnum } from './enum.mjs';
import { ExtendsFunction } from './function.mjs';
import { ExtendsInteger } from './integer.mjs';
import { ExtendsIntersect } from './intersect.mjs';
import { ExtendsLiteral } from './literal.mjs';
import { ExtendsNever } from './never.mjs';
import { ExtendsNull } from './null.mjs';
import { ExtendsNumber } from './number.mjs';
import { ExtendsObject } from './object.mjs';
import { ExtendsRecord } from './record.mjs';
import { ExtendsString } from './string.mjs';
import { ExtendsSymbol } from './symbol.mjs';
import { ExtendsTemplateLiteral } from './template_literal.mjs';
import { ExtendsTuple } from './tuple.mjs';
import { ExtendsUndefined } from './undefined.mjs';
import { ExtendsUnion } from './union.mjs';
import { ExtendsUnknown } from './unknown.mjs';
import { ExtendsVoid } from './void.mjs';
// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
import { IsAny } from '../types/any.mjs';
import { IsArray } from '../types/array.mjs';
import { IsBigInt } from '../types/bigint.mjs';
import { IsBoolean } from '../types/boolean.mjs';
import { IsConstructor } from '../types/constructor.mjs';
import { IsDependent } from '../types/dependent.mjs';
import { IsEnum } from '../types/enum.mjs';
import { IsFunction } from '../types/function.mjs';
import { IsInteger } from '../types/integer.mjs';
import { IsIntersect } from '../types/intersect.mjs';
import { IsLiteral } from '../types/literal.mjs';
import { IsNever } from '../types/never.mjs';
import { IsNull } from '../types/null.mjs';
import { IsNumber } from '../types/number.mjs';
import { IsObject } from '../types/object.mjs';
import { IsRecord, RecordPattern, RecordValue } from '../types/record.mjs';
import { IsString } from '../types/string.mjs';
import { IsSymbol } from '../types/symbol.mjs';
import { IsTemplateLiteral } from '../types/template_literal.mjs';
import { IsTuple } from '../types/tuple.mjs';
import { IsUndefined } from '../types/undefined.mjs';
import { IsUnknown } from '../types/unknown.mjs';
import { IsUnion } from '../types/union.mjs';
import { IsVoid } from '../types/void.mjs';
import * as Result from './result.mjs';
export function ExtendsLeft(inferred, left, right) {
    return (IsAny(left) ? ExtendsAny(inferred, left, right) :
        IsArray(left) ? ExtendsArray(inferred, left, left.items, right) :
            IsBigInt(left) ? ExtendsBigInt(inferred, left, right) :
                IsBoolean(left) ? ExtendsBoolean(inferred, left, right) :
                    IsConstructor(left) ? ExtendsConstructor(inferred, left.parameters, left.instanceType, right) :
                        IsDependent(left) ? ExtendsDependent(inferred, left.if, left.then, left.else, right) :
                            IsEnum(left) ? ExtendsEnum(inferred, left.enum, right) :
                                IsFunction(left) ? ExtendsFunction(inferred, left.parameters, left.returnType, right) :
                                    IsInteger(left) ? ExtendsInteger(inferred, left, right) :
                                        IsIntersect(left) ? ExtendsIntersect(inferred, left.allOf, right) :
                                            IsLiteral(left) ? ExtendsLiteral(inferred, left, right) :
                                                IsNever(left) ? ExtendsNever(inferred, left, right) :
                                                    IsNull(left) ? ExtendsNull(inferred, left, right) :
                                                        IsNumber(left) ? ExtendsNumber(inferred, left, right) :
                                                            IsObject(left) ? ExtendsObject(inferred, left.properties, right) :
                                                                IsRecord(left) ? ExtendsRecord(inferred, RecordPattern(left), RecordValue(left), right) :
                                                                    IsString(left) ? ExtendsString(inferred, left, right) :
                                                                        IsSymbol(left) ? ExtendsSymbol(inferred, left, right) :
                                                                            IsTemplateLiteral(left) ? ExtendsTemplateLiteral(inferred, left.pattern, right) :
                                                                                IsTuple(left) ? ExtendsTuple(inferred, left.items, right) :
                                                                                    IsUndefined(left) ? ExtendsUndefined(inferred, left, right) :
                                                                                        IsUnion(left) ? ExtendsUnion(inferred, left.anyOf, right) :
                                                                                            IsUnknown(left) ? ExtendsUnknown(inferred, left, right) :
                                                                                                IsVoid(left) ? ExtendsVoid(inferred, left, right) :
                                                                                                    Result.ExtendsFalse());
}
