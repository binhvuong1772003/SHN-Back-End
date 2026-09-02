"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMcpContextToken = exports.createMcpContextToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
    if (typeof claims.userId !== "string" ||
        typeof claims.shopSlug !== "string" ||
        typeof claims.role !== "string" ||
        !Array.isArray(claims.permissions) ||
        !claims.permissions.every((permission) => typeof permission === "string")) {
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
exports.verifyMcpContextToken = verifyMcpContextToken;
