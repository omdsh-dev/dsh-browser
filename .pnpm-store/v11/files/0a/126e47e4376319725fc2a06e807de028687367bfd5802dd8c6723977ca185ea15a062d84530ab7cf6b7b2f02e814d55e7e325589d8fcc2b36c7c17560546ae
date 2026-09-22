"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolName = toolName;
exports.toolErrorContent = toolErrorContent;
exports.runRunnableTool = runRunnableTool;
const ToolError_1 = require("./ToolError.js");
/**
 * The name the model calls a tool by: `mcp_server_name` for MCP toolsets, `type` for nameless server
 * toolsets (browser/computer), `name` for everything else.
 */
function toolName(tool) {
    return ('name' in tool ? tool.name
        : 'mcp_server_name' in tool ? tool.mcp_server_name
            : tool.type);
}
/** Tool-result content for a thrown value: a {@link ToolError}'s own content, otherwise `Error: <message>`. */
function toolErrorContent(e) {
    return e instanceof ToolError_1.ToolError ? e.content : `Error: ${e instanceof Error ? e.message : String(e)}`;
}
/** Parse the input, run the tool, and turn anything thrown into an error result. */
async function runRunnableTool(tool, rawInput, context) {
    try {
        const input = tool.parse ? tool.parse(rawInput) : rawInput;
        const content = await tool.run(input, context);
        return { content, isError: false };
    }
    catch (e) {
        return { content: toolErrorContent(e), isError: true };
    }
}
//# sourceMappingURL=BetaRunnableTool.js.map