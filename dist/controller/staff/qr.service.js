"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStaffQRService = void 0;
// src/service/staff/qr.service.ts
const qrcode_1 = __importDefault(require("qrcode"));
const generateStaffQRService = async (userId, shopSlug) => {
    const payload = JSON.stringify({ userId, shopSlug });
    const qrImage = await qrcode_1.default.toDataURL(payload);
    return qrImage; // base64 image
};
exports.generateStaffQRService = generateStaffQRService;
