import { run } from "@openai/agents";
import { createAdminAgent } from "@/ai/agents/admin.agent";
import { createMcpClient } from "@/ai/config/mcp-client";
import type { SalonAgentContext } from "@/ai/types/agent-context";
import type { AiContextMessage } from "./conversation.service";

export const askAIService = async (
  message: string,
  context: SalonAgentContext,
  history: AiContextMessage[] = [],
) => {
  const mcpClient = createMcpClient(context);
  await mcpClient.connect();

  try {
    const result = await run(
      createAdminAgent(mcpClient),
      formatConversationInput(history, message),
      { context },
    );

    return result.finalOutput;
  } finally {
    await mcpClient.close();
  }
};

const formatConversationInput = (
  history: AiContextMessage[],
  message: string,
) => {
  if (history.length === 0) return message;

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
