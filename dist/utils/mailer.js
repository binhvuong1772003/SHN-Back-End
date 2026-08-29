"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const hasEmailCreds = process.env.EMAIL_USER && process.env.EMAIL_PASS;
const realTransporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const devTransporter = {
    sendMail: async (mailOptions) => {
        console.log("================== DEV EMAIL ==================");
        console.log("To:", mailOptions.to);
        console.log("Subject:", mailOptions.subject);
        if (mailOptions.text)
            console.log("Text:", mailOptions.text);
        if (mailOptions.html)
            console.log("HTML:", mailOptions.html);
        console.log("===============================================");
        return { messageId: "dev-message-id", response: "logged-to-console" };
    },
};
exports.transporter = hasEmailCreds ? realTransporter : devTransporter;
