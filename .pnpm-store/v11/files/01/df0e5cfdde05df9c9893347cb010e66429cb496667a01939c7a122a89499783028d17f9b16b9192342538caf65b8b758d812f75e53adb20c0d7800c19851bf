"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.betaStandardSchemaOutputFormat = betaStandardSchemaOutputFormat;
exports.betaStandardSchemaTool = betaStandardSchemaTool;
const transform_json_schema_1 = require("../../lib/transform-json-schema.js");
const error_1 = require("../../core/error.js");
const standard_schema_1 = require("../../lib/standard-schema.js");
/**
 * Creates a JSON schema output format object from the given
 * [Standard Schema](https://standardschema.dev) (Zod, Valibot, ArkType, ...).
 *
 * If this is passed to the `.parse()` method then the response message will contain a
 * `.parsed_output` property that is the result of parsing the content with the given schema.
 *
 * This can be passed directly to the `.create()` method but will not
 * result in any automatic parsing, you'll have to parse the response yourself.
 */
function betaStandardSchemaOutputFormat(schema, options) {
    const jsonSchema = (0, transform_json_schema_1.transformJSONSchema)((0, standard_schema_1.standardSchemaToJSONSchema)(schema, options?.jsonSchema));
    return {
        type: 'json_schema',
        schema: {
            ...jsonSchema,
        },
        parse: (content) => {
            let parsed;
            try {
                parsed = JSON.parse(content);
            }
            catch (error) {
                throw new error_1.AnthropicError(`Failed to parse structured output as JSON: ${error instanceof Error ? error.message : String(error)}`);
            }
            return (0, standard_schema_1.parseWithStandardSchema)(schema, parsed);
        },
    };
}
/**
 * Creates a tool using the provided [Standard Schema](https://standardschema.dev)
 * (Zod, Valibot, ArkType, ...) that can be passed into the `.toolRunner()` method.
 * The schema's JSON Schema representation is sent to the API and the provided
 * function's input arguments will be validated against the schema.
 */
function betaStandardSchemaTool(options) {
    const jsonSchema = (0, standard_schema_1.standardSchemaToJSONSchema)(options.inputSchema, options.jsonSchema);
    if (jsonSchema['type'] !== 'object') {
        throw new Error(`Schema for tool "${options.name}" must be an object, but got ${String(jsonSchema['type'])}`);
    }
    return {
        type: 'custom',
        name: options.name,
        input_schema: jsonSchema,
        description: options.description,
        run: options.run,
        parse: (args) => (0, standard_schema_1.parseWithStandardSchema)(options.inputSchema, args),
        ...(options.close ? { close: options.close } : {}),
    };
}
//# sourceMappingURL=standard-schema.js.map