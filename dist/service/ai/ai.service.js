"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAIService = void 0;
const agents_1 = require("@openai/agents");
const admin_agent_1 = require("../../ai/agents/admin.agent");
const mcp_client_1 = require("../../ai/config/mcp-client");
const askAIService = async (message, context) => {
    const mcpClient = (0, mcp_client_1.createMcpClient)(context);
    await mcpClient.connect();
    try {
        const result = await (0, agents_1.run)((0, admin_agent_1.createAdminAgent)(mcpClient), message, { context });
        return result.finalOutput;
    }
    finally {
        await mcpClient.close();
    }
};
exports.askAIService = askAIService;
