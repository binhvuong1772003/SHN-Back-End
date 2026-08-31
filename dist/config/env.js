"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const required = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "QR_SECRET"];
required.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing env: ${key}`);
    }
});
exports.env = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
};
