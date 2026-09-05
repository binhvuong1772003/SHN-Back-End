"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMcpContextToken = exports.createMcpContextToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mcp_context_1 = require("../types/mcp-context");
const MCP_CONTEXT_AUDIENCE = "shn-mcp";
const getMcpSecret = () => {
    const secret = process.env.MCP_INTERNAL_SECRET;
    if (!secret)
        throw new Error("MCP_INTERNAL_SECRET is not configured");
    return secret;
};
const createMcpContextToken = (context) => jsonwebtoken_1.default.sign(context, getMcpSecret(), {
    audience: MCP_CONTEXT_AUDIENCE,
    expiresIn: "2m",
});
exports.createMcpContextToken = createMcpContextToken;
const verifyMcpContextToken = (token) => {
    const payload = jsonwebtoken_1.default.verify(token, getMcpSecret(), {
        audience: MCP_CONTEXT_AUDIENCE,
    });
    if (typeof payload === "string") {
        throw new Error("Invalid MCP context token");
    }
    const claims = payload;
    return mcp_context_1.mcpContextSchema.parse({
        userId: claims.userId,
        shopId: claims.shopId,
        shopSlug: claims.shopSlug,
        role: claims.role,
        permissions: claims.permissions,
        currentDate: claims.currentDate,
        requestId: claims.requestId,
        timezone: claims.timezone,
    });
};
exports.verifyMcpContextToken = verifyMcpContextToken;
