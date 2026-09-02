import jwt, { type JwtPayload } from "jsonwebtoken";
import type { McpContext } from "../types/mcp-context";

const MCP_CONTEXT_AUDIENCE = "shn-mcp";

const getMcpSecret = (): string => {
  const secret = process.env.MCP_INTERNAL_SECRET;
  if (!secret) throw new Error("MCP_INTERNAL_SECRET is not configured");
  return secret;
};

export const createMcpContextToken = (context: McpContext): string =>
  jwt.sign(context, getMcpSecret(), {
    audience: MCP_CONTEXT_AUDIENCE,
    expiresIn: "2m",
  });

export const verifyMcpContextToken = (token: string): McpContext => {
  const payload = jwt.verify(token, getMcpSecret(), {
    audience: MCP_CONTEXT_AUDIENCE,
  });

  if (typeof payload === "string") {
    throw new Error("Invalid MCP context token");
  }

  const claims = payload as JwtPayload & Partial<McpContext>;
  if (
    typeof claims.userId !== "string" ||
    typeof claims.shopSlug !== "string" ||
    typeof claims.role !== "string" ||
    !Array.isArray(claims.permissions) ||
    !claims.permissions.every((permission) => typeof permission === "string")
  ) {
    throw new Error("Invalid MCP context claims");
  }

  return {
    userId: claims.userId,
    shopSlug: claims.shopSlug,
    role: claims.role,
    permissions: claims.permissions,
    requestId: typeof claims.requestId === "string" ? claims.requestId : undefined,
  };
};
