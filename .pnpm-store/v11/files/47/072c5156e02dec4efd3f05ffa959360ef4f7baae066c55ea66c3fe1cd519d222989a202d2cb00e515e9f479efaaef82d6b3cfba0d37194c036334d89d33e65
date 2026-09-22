import { ToolError } from "./ToolError.mjs";
/**
 * The name the model calls a tool by: `mcp_server_name` for MCP toolsets, `type` for nameless server
 * toolsets (browser/computer), `name` for everything else.
 */
export function toolName(tool) {
    return ('name' in tool ? tool.name
        : 'mcp_server_name' in tool ? tool.mcp_server_name
            : tool.type);
}
/** Tool-result content for a thrown value: a {@link ToolError}'s own content, otherwise `Error: <message>`. */
export function toolErrorContent(e) {
    return e instanceof ToolError ? e.content : `Error: ${e instanceof Error ? e.message : String(e)}`;
}
/** Parse the input, run the tool, and turn anything thrown into an error result. */
export async function runRunnableTool(tool, rawInput, context) {
    try {
        const input = tool.parse ? tool.parse(rawInput) : rawInput;
        const content = await tool.run(input, context);
        return { content, isError: false };
    }
    catch (e) {
        return { content: toolErrorContent(e), isError: true };
    }
}
//# sourceMappingURL=BetaRunnableTool.mjs.map