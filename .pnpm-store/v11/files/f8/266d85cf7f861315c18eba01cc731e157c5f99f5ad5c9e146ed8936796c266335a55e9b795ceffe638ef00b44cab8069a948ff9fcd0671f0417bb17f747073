import * as z from 'zod/v4';
import { AutoParseableBetaOutputFormat } from "../../lib/beta-parser.mjs";
import { BetaRunnableTool, BetaToolRunContext, Promisable } from "../../lib/tools/BetaRunnableTool.mjs";
import { BetaToolResultContentBlockParam } from "../../resources/beta.mjs";
/**
 * Creates a JSON schema output format object from the given Zod schema.
 *
 * If this is passed to the `.parse()` method then the response message will contain a
 * `.parsed_output` property that is the result of parsing the content with the given Zod object.
 *
 * This can be passed directly to the `.create()` method but will not
 * result in any automatic parsing, you'll have to parse the response yourself.
 */
export declare function betaZodOutputFormat<ZodInput extends z.ZodType>(zodObject: ZodInput): AutoParseableBetaOutputFormat<z.infer<ZodInput>>;
/**
 * Creates a tool using the provided Zod schema that can be passed
 * into the `.toolRunner()` method. The Zod schema will automatically be
 * converted into JSON Schema when passed to the API. The provided function's
 * input arguments will also be validated against the provided schema.
 */
export declare function betaZodTool<InputSchema extends z.ZodType>(options: {
    name: string;
    inputSchema: InputSchema;
    description: string;
    run: (args: z.infer<InputSchema>, context?: BetaToolRunContext) => Promisable<string | Array<BetaToolResultContentBlockParam>>;
    /**
     * Optional cleanup hook for tools that hold process-level resources (e.g. a
     * persistent shell). `client.beta.sessions.events.toolRunner` calls it once
     * when iteration ends.
     */
    close?: () => void | Promise<void>;
}): BetaRunnableTool<z.infer<InputSchema>>;
//# sourceMappingURL=zod.d.mts.map