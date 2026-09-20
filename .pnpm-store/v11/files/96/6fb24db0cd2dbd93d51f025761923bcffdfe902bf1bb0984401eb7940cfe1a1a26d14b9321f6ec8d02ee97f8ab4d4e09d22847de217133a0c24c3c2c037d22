// deno-fmt-ignore-file
import { ExtendsLeft } from './extends_left.mjs';
import * as Result from './result.mjs';
export function ExtendsDependent(inferred, if_, then_, else_, right) {
    return Result.Match(ExtendsLeft(inferred, if_, right), () => ExtendsLeft(inferred, then_, right), () => ExtendsLeft(inferred, else_, right));
}
