import { AutoParseableBetaOutputFormat } from "../../lib/beta-parser.mjs";
import { BetaRunnableTool, BetaToolRunContext, Promisable } from "../../lib/tools/BetaRunnableTool.mjs";
import { BetaToolResultContentBlockParam } from "../../resources/beta.mjs";
import { StandardSchemaV1 } from "../../lib/standard-schema.mjs";
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
export declare function betaStandardSchemaOutputFormat<Schema extends StandardSchemaV1>(schema: Schema, options?: {
    /**
     * The JSON schema to send to the API. Derived from the schema's
     * `~standard.jsonSchema` (Standard JSON Schema) interface if not given.
     */
    jsonSchema?: Record<string, unknown> | undefined;
}): AutoParseableBetaOutputFormat<StandardSchemaV1.InferOutput<Schema>>;
/**
 * Creates a tool using the provided [Standard Schema](https://standardschema.dev)
 * (Zod, Valibot, ArkType, ...) that can be passed into the `.toolRunner()` method.
 * The schema's JSON Schema representation is sent to the API and the provided
 * function's input arguments will be validated against the schema.
 */
export declare function betaStandardSchemaTool<InputSchema extends StandardSchemaV1>(options: {
    name: string;
    inputSchema: InputSchema;
    description: string;
    run: (args: StandardSchemaV1.InferOutput<InputSchema>, context?: BetaToolRunContext) => Promisable<string | Array<BetaToolResultContentBlockParam>>;
    /**
     * The JSON schema to send as the tool's `input_schema`. Derived from the schema's
     * `~standard.jsonSchema` (Standard JSON Schema) interface if not given.
     */
    jsonSchema?: Record<string, unknown> | undefined;
    /**
     * Optional cleanup hook for tools that hold process-level resources (e.g. a
     * persistent shell). `client.beta.sessions.events.toolRunner` calls it once
     * when iteration ends.
     */
    close?: () => void | Promise<void>;
}): BetaRunnableTool<StandardSchemaV1.InferOutput<InputSchema>>;
//# sourceMappingURL=standard-schema.d.mts.map