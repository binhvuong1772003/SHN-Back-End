import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape, z } from "zod";
import type { McpContext } from "./mcp-context";

export type McpToolAccess =
  | "SELF_READ"
  | "SHOP_READ"
  | "FINANCE_READ"
  | "PAYROLL_READ_ALL"
  | "OWNER_READ";

export interface McpToolDefinition<
  TInput extends ZodRawShape = ZodRawShape,
  TOutput = unknown,
> {
  name: string;
  description: string;
  access: McpToolAccess;
  inputSchema: TInput;
  execute: (
    input: z.infer<z.ZodObject<TInput>>,
    context: McpContext,
  ) => Promise<TOutput>;
}

export type McpToolRegistry = readonly McpToolDefinition<any, any>[];

export type McpToolRegistrar = (server: McpServer, context: McpContext) => void;
