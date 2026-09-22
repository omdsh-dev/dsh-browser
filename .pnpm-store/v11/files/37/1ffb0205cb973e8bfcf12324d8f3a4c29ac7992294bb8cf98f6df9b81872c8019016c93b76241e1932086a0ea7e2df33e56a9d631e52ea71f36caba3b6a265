// deno-fmt-ignore-file
import { EmitGuard as E } from '../../guard/index.mjs';
// ------------------------------------------------------------------
// Build
// ------------------------------------------------------------------
export function BuildSchemaBoolean(_stack, _context, schema, _value) {
    return schema ? E.Constant(true) : E.Constant(false);
}
// ------------------------------------------------------------------
// Check
// ------------------------------------------------------------------
export function CheckSchemaBoolean(_stack, _context, schema, _value) {
    return schema;
}
// ------------------------------------------------------------------
// Error
// ------------------------------------------------------------------
export function ErrorSchemaBoolean(stack, context, schemaPath, instancePath, schema, value) {
    return CheckSchemaBoolean(stack, context, schema, value) || context.AddError({
        keyword: 'boolean',
        schemaPath,
        instancePath,
        params: {}
    });
}
