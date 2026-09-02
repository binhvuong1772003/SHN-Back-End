import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { verifyMcpContextToken } from "./auth/context-token";
import { registerMcpTools } from "./registry/tool-registry";
import type { McpContext } from "./types/mcp-context";

const app = express();
const port = Number(process.env.MCP_PORT ?? 8080);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "shn-mcp" });
});

app.all("/mcp", async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "MCP authorization is required" });
    return;
  }

  let context: McpContext;
  try {
    context = verifyMcpContextToken(authorization.slice("Bearer ".length));
  } catch {
    res.status(401).json({ error: "Invalid MCP context" });
    return;
  }

  const server = new McpServer({
    name: "shn-mcp-server",
    version: "1.0.0",
  });
  registerMcpTools(server, context);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed", {
      requestId: context.requestId ?? randomUUID(),
      error,
    });
    if (!res.headersSent) {
      res.status(500).json({ error: "MCP request failed" });
    }
  } finally {
    await server.close().catch((error) => {
      console.error("MCP server cleanup failed", error);
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`MCP server running on port ${port}`);
});
