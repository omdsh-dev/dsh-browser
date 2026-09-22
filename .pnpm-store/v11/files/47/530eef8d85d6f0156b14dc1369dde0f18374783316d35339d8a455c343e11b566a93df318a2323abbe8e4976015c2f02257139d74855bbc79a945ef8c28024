import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Promisable, BetaRunnableTool, BetaToolRunContext } from "../../lib/tools/BetaRunnableTool.js";
import { BetaToolResultContentBlockParam } from "../../resources/beta.js";
import { AutoParseableBetaOutputFormat } from "../../lib/beta-parser.js";
type NoInfer<T> = T extends infer R ? R : never;
/**
 * Creates a Tool with a provided JSON schema that can be passed
 * to the `.toolRunner()` method. The schema is used to automatically validate
 * the input arguments for the tool.
 */
export declare function betaTool<const Schema extends Exclude<JSONSchema, boolean> & {
    type: 'object';
}>(options: {
    name: string;
    inputSchema: Schema;
    description: string;
    run: (args: NoInfer<FromSchema<Schema>>, context?: BetaToolRunContext) => Promisable<string | Array<BetaToolResultContentBlockParam>>;
    /**
     * Optional cleanup hook for tools that hold process-level resources (e.g. a
     * persistent shell). `client.beta.sessions.events.toolRunner` calls it once
     * when iteration ends.
     */
    close?: () => void | Promise<void>;
}): BetaRunnableTool<NoInfer<FromSchema<Schema>>>;
/**
 * Creates a JSON schema output format object from the given JSON schema.
 * If this is passed to the `.parse()` method then the response message will contain a
 * `.parsed_output` property that is the result of parsing the content with the given JSON schema.
 *
 */
export declare function betaJSONSchemaOutputFormat<const Schema extends Exclude<JSONSchema, boolean> & {
    type: 'object';
}>(jsonSchema: Schema, options?: {
    transform?: boolean;
}): AutoParseableBetaOutputFormat<NoInfer<FromSchema<Schema>>>;
export {};
//# sourceMappingURL=json-schema.d.ts.map