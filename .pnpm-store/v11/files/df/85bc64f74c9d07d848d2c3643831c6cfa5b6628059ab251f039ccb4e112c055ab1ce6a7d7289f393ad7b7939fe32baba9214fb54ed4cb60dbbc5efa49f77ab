import { transformJSONSchema } from "../../lib/transform-json-schema.mjs";
import { AnthropicError } from "../../core/error.mjs";
import { parseWithStandardSchema, standardSchemaToJSONSchema, } from "../../lib/standard-schema.mjs";
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
export function betaStandardSchemaOutputFormat(schema, options) {
    const jsonSchema = transformJSONSchema(standardSchemaToJSONSchema(schema, options?.jsonSchema));
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
                throw new AnthropicError(`Failed to parse structured output as JSON: ${error instanceof Error ? error.message : String(error)}`);
            }
            return parseWithStandardSchema(schema, parsed);
        },
    };
}
/**
 * Creates a tool using the provided [Standard Schema](https://standardschema.dev)
 * (Zod, Valibot, ArkType, ...) that can be passed into the `.toolRunner()` method.
 * The schema's JSON Schema representation is sent to the API and the provided
 * function's input arguments will be validated against the schema.
 */
export function betaStandardSchemaTool(options) {
    const jsonSchema = standardSchemaToJSONSchema(options.inputSchema, options.jsonSchema);
    if (jsonSchema['type'] !== 'object') {
        throw new Error(`Schema for tool "${options.name}" must be an object, but got ${String(jsonSchema['type'])}`);
    }
    return {
        type: 'custom',
        name: options.name,
        input_schema: jsonSchema,
        description: options.description,
        run: options.run,
        parse: (args) => parseWithStandardSchema(options.inputSchema, args),
        ...(options.close ? { close: options.close } : {}),
    };
}
//# sourceMappingURL=standard-schema.mjs.map