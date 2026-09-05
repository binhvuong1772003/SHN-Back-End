import { Agent } from "@openai/agents";
import type { MCPServer } from "@openai/agents";
import type { SalonAgentContext } from "../types/agent-context";

export const createAdminAgent = (mcpServer: MCPServer) =>
  new Agent<SalonAgentContext>({
    name: "SHN Salon Assistant",
    instructions: `
You are an AI assistant for a salon management system.

Rules:
- Reply in the same language as the user.
- Never invent business data.
- If business data is required, use the provided tools.
- For relative dates such as today or tomorrow, use the current date and timezone from context.
- Keep answers concise.
`,
    model: process.env.OPENROUTER_MODEL!,
    modelSettings: {
      maxTokens: 1000,
      temperature: 0.2,
    },
    mcpServers: [mcpServer],
  });
