"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMcpTools = exports.mcpToolRegistry = void 0;
const policy_checker_1 = require("../policies/policy-checker");
const get_my_schedule_tool_1 = require("../tools/staff/get-my-schedule.tool");
exports.mcpToolRegistry = [get_my_schedule_tool_1.getMyScheduleMcpTool];
const registerMcpTools = (server, context) => {
    for (const definition of exports.mcpToolRegistry) {
        if (!(0, policy_checker_1.canUseMcpTool)(context, definition.access))
            continue;
        server.registerTool(definition.name, {
            description: definition.description,
            inputSchema: definition.inputSchema,
            annotations: {
                readOnlyHint: definition.mode === "read",
                destructiveHint: definition.mode === "write",
            },
        }, async (input) => {
            try {
                const output = await definition.execute(input, context);
                return {
                    content: [{ type: "text", text: JSON.stringify(output) }],
                };
            }
            catch {
                return {
                    isError: true,
                    content: [{ type: "text", text: "Tool execution failed" }],
                };
            }
        });
    }
};
exports.registerMcpTools = registerMcpTools;
