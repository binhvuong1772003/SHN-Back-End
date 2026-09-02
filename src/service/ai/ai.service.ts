import { run } from "@openai/agents";
import { createAdminAgent } from "@/ai/agents/admin.agent";
import { createMcpClient } from "@/ai/config/mcp-client";
import type { SalonAgentContext } from "@/ai/types/agent-context";

export const askAIService = async (
  message: string,
  context: SalonAgentContext,
) => {
  const mcpClient = createMcpClient(context);
  await mcpClient.connect();

  try {
    const result = await run(createAdminAgent(mcpClient), message, { context });
    return result.finalOutput;
  } finally {
    await mcpClient.close();
  }
};
