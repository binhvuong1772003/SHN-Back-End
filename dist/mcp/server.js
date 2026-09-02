"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const node_crypto_1 = require("node:crypto");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const context_token_1 = require("./auth/context-token");
const tool_registry_1 = require("./registry/tool-registry");
const app = (0, express_1.default)();
const port = Number(process.env.MCP_PORT ?? 8080);
app.use(express_1.default.json({ limit: "1mb" }));
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
    let context;
    try {
        context = (0, context_token_1.verifyMcpContextToken)(authorization.slice("Bearer ".length));
    }
    catch {
        res.status(401).json({ error: "Invalid MCP context" });
        return;
    }
    const server = new mcp_js_1.McpServer({
        name: "shn-mcp-server",
        version: "1.0.0",
    });
    (0, tool_registry_1.registerMcpTools)(server, context);
    const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    }
    catch (error) {
        console.error("MCP request failed", {
            requestId: context.requestId ?? (0, node_crypto_1.randomUUID)(),
            error,
        });
        if (!res.headersSent) {
            res.status(500).json({ error: "MCP request failed" });
        }
    }
    finally {
        await server.close().catch((error) => {
            console.error("MCP server cleanup failed", error);
        });
    }
});
app.listen(port, "0.0.0.0", () => {
    console.log(`MCP server running on port ${port}`);
});
