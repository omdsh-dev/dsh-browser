"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardSchemaToJSONSchema = standardSchemaToJSONSchema;
exports.parseWithStandardSchema = parseWithStandardSchema;
const error_1 = require("../core/error.js");
/**
 * Returns `jsonSchema` if given, otherwise the schema's Standard JSON Schema `input`
 * representation (the model produces the value that the validator consumes).
 */
function standardSchemaToJSONSchema(schema, jsonSchema) {
    if (jsonSchema) {
        return jsonSchema;
    }
    const std = schema['~standard'];
    if (std.jsonSchema) {
        return std.jsonSchema.input({ target: 'draft-2020-12' });
    }
    throw new error_1.AnthropicError(`Could not derive a JSON Schema from this ${std.vendor} schema as it does not implement Standard JSON Schema (\`~standard.jsonSchema\`). Pass the \`jsonSchema\` option, or use a library version that implements it (e.g. zod >= 4.2, or valibot via \`toStandardJsonSchema()\`).`);
}
/**
 * Validates `value` with `~standard.validate` and returns the typed output, throwing an
 * `AnthropicError` on issues. Validation must be synchronous because `parse` hooks are.
 */
function parseWithStandardSchema(schema, value) {
    const result = schema['~standard'].validate(value);
    if (result instanceof Promise) {
        // avoid an unhandled rejection from the discarded result
        result.catch(() => { });
        throw new error_1.AnthropicError(`Async validation is not supported: the ${schema['~standard'].vendor} schema's \`~standard.validate()\` returned a Promise.`);
    }
    if (result.issues) {
        const formattedIssues = result.issues.slice(0, 5).map(formatIssue).join('\n');
        const issueCount = result.issues.length;
        const suffix = issueCount > 5 ? `\n  ... and ${issueCount - 5} more issue(s)` : '';
        throw new error_1.AnthropicError(`Schema validation failed with ${issueCount} issue(s):\n${formattedIssues}${suffix}`);
    }
    return result.value;
}
function formatIssue(issue) {
    const path = (issue.path ?? [])
        .map((segment) => String(typeof segment === 'object' ? segment.key : segment))
        .join('.');
    return path ? `  - ${path}: ${issue.message}` : `  - ${issue.message}`;
}
//# sourceMappingURL=standard-schema.js.map