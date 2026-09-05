"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAIService = void 0;
const agents_1 = require("@openai/agents");
const admin_agent_1 = require("../../ai/agents/admin.agent");
const mcp_client_1 = require("../../ai/config/mcp-client");
const askAIService = async (message, context, history = []) => {
    const mcpClient = (0, mcp_client_1.createMcpClient)(context);
    await mcpClient.connect();
    try {
        const result = await (0, agents_1.run)((0, admin_agent_1.createAdminAgent)(mcpClient), formatConversationInput(history, message), { context });
        return result.finalOutput;
    }
    finally {
        await mcpClient.close();
    }
};
exports.askAIService = askAIService;
const formatConversationInput = (history, message) => {
    if (history.length === 0)
        return message;
    const historyText = history
        .map((item) => `${item.role}: ${item.content}`)
        .join("\n");
    return [
        "Conversation history:",
        historyText,
        "",
        "Current user message:",
        message,
    ].join("\n");
};
