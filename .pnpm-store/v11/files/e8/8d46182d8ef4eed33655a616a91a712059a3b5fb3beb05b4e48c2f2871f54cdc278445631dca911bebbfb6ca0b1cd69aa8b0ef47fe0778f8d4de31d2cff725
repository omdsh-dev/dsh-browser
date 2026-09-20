// deno-fmt-ignore-file
import { Guard } from '../../guard/index.mjs';
import { IsAny } from '../types/any.mjs';
import { IsUnknown } from '../types/unknown.mjs';
import { IsObject } from '../types/object.mjs';
import { IsRecord, RecordPatternToType, RecordPattern, RecordValue } from '../types/record.mjs';
import { ExtendsLeft } from './extends_left.mjs';
import * as Result from './result.mjs';
function FromObject(inferred, properties) {
    return (Guard.IsEqual(Guard.Keys(properties).length, 0)
        ? Result.ExtendsTrue(inferred)
        : Result.ExtendsFalse());
}
function FromRecord(inferred, _leftKey, leftValue, _rightKey, rightValue) {
    return ExtendsLeft(inferred, leftValue, rightValue);
}
export function ExtendsRecord(inferred, leftPattern, leftValue, right) {
    return (IsRecord(right) ? FromRecord(inferred, RecordPatternToType(leftPattern), leftValue, RecordPatternToType(RecordPattern(right)), RecordValue(right)) :
        IsObject(right) ? FromObject(inferred, right.properties) :
            IsAny(right) ? Result.ExtendsTrue(inferred) :
                IsUnknown(right) ? Result.ExtendsTrue(inferred) :
                    Result.ExtendsFalse());
}
