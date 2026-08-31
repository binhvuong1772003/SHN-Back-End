"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@/config/env");
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./socket");
require("@/jobs/attendance.job");
dotenv_1.default.config();
process.env.TZ = 'Asia/Ho_Chi_Minh';
const PORT = process.env.PORT || 3000;
const httpServer = (0, http_1.createServer)(app_1.default);
(0, socket_1.initSocket)(httpServer);
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
