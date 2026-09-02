import { MCPServerStreamableHttp } from "@openai/agents";
import type { McpContext } from "@/mcp/types/mcp-context";
import { createMcpContextToken } from "@/mcp/auth/context-token";

export const createMcpClient = (context: McpContext) => {
  const url = process.env.MCP_SERVER_URL ?? "http://localhost:8081/mcp";
  const contextToken = createMcpContextToken(context);

  return new MCPServerStreamableHttp({
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
