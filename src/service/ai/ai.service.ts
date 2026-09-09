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
      createAdminAgent(mcpClient, context),
      formatConversationInput(history, message, context),
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
  context: SalonAgentContext,
) => {
  const runtimeContext = [
    "Authoritative runtime context (always use this over conversation history):",
    `currentDate=${context.currentDate}`,
    `timezone=${context.timezone}`,
  ].join("\n");
  if (history.length === 0) return `${runtimeContext}\n\n${message}`;

  const historyText = history
    .map((item) => `${item.role}: ${item.content}`)
    .join("\n");

  return [
    runtimeContext,
    "",
    "Conversation history:",
    historyText,
    "",
    "Current user message:",
    message,
  ].join("\n");
};
