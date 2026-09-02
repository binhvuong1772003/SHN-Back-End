"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpClient = void 0;
const agents_1 = require("@openai/agents");
const context_token_1 = require("../../mcp/auth/context-token");
const createMcpClient = (context) => {
    const url = process.env.MCP_SERVER_URL ?? "http://localhost:8081/mcp";
    const contextToken = (0, context_token_1.createMcpContextToken)(context);
    return new agents_1.MCPServerStreamableHttp({
        name: "shn-mcp",
        url,
        cacheToolsList: false,
        requestInit: {
            headers: {
                Authorization: `Bearer ${contextToken}`,
            },
        },
        useStructuredContent: true,
    });
};
exports.createMcpClient = createMcpClient;
