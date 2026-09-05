import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape } from "zod";
import type { McpContext } from "./mcp-context";

export type McpToolAccess =
  | "SELF_READ"
  | "SHOP_READ"
  | "FINANCE_READ"
  | "PAYROLL_READ_ALL"
  | "OWNER_READ";

export type McpToolMode = "read" | "write";

export interface McpToolDefinition<
  TInput extends object = object,
  TOutput = unknown,
> {
  name: string;
  description: string;
  access: McpToolAccess;
  mode: McpToolMode;
  inputSchema: ZodRawShape;
  execute(input: TInput, context: McpContext): Promise<TOutput>;
}

export type AnyMcpToolDefinition = McpToolDefinition<never, unknown>;
export type McpToolRegistry = readonly AnyMcpToolDefinition[];

export type McpToolRegistrar = (server: McpServer, context: McpContext) => void;
