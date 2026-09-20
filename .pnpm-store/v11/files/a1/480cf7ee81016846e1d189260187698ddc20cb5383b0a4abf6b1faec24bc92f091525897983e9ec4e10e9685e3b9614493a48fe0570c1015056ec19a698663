// deno-fmt-ignore-file
import { Hashing } from '../../system/hashing/index.mjs';
import { EmitGuard as E } from '../../guard/index.mjs';
import { BuildSchema } from './schema.mjs';
const index = [0];
const names = new Map;
const funcs = new Map();
// ------------------------------------------------------------------
// CreateName
// ------------------------------------------------------------------
function NextName() {
    return Hashing.Hash(index[0]++);
}
function CreateName(schema, href) {
    if (!names.has(schema))
        names.set(schema, new Map());
    const hrefs = names.get(schema);
    if (hrefs.has(href))
        return hrefs.get(href);
    const name = NextName();
    hrefs.set(href, name);
    return name;
}
// ------------------------------------------------------------------
// CreateCallExpression
// ------------------------------------------------------------------
function CreateCallExpression(context, _schema, name, value) {
    return context.UseUnevaluated()
        ? E.Call(`check_${name}`, ['context', value])
        : E.Call(`check_${name}`, [value]);
}
// ------------------------------------------------------------------
// CreateFunctionExpression
// ------------------------------------------------------------------
function CreateFunctionExpression(stack, context, schema, name) {
    const expression = BuildSchema(stack, context, schema, 'value');
    return context.UseUnevaluated()
        ? E.ConstDeclaration(`check_${name}`, E.ArrowFunction(['context', 'value'], expression))
        : E.ConstDeclaration(`check_${name}`, E.ArrowFunction(['value'], expression));
}
// ------------------------------------------------------------------
// ResetFunctions
// ------------------------------------------------------------------
export function ResetFunctions() {
    index[0] = 0;
    names.clear();
    funcs.clear();
}
// ------------------------------------------------------------------
// GetFunctions
// ------------------------------------------------------------------
export function GetFunctions() {
    return [...funcs.values()];
}
// ------------------------------------------------------------------
// CreateFunction
// ------------------------------------------------------------------
export function CreateFunction(stack, context, schema, value) {
    const name = CreateName(schema, stack.BaseURL().href);
    const call = CreateCallExpression(context, schema, name, value);
    if (funcs.has(name))
        return call;
    funcs.set(name, '');
    funcs.set(name, CreateFunctionExpression(stack, context, schema, name));
    return call;
}
