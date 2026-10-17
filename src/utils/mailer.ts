import nodemailer from "nodemailer";

const hasEmailCreds = process.env.EMAIL_USER && process.env.EMAIL_PASS;

const realTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const devTransporter = {
  sendMail: async (mailOptions: Record<string, unknown>) => {
    console.log("================== DEV EMAIL ==================");
    console.log("To:", mailOptions.to);
    console.log("Subject:", mailOptions.subject);
    if (mailOptions.text) console.log("Text:", mailOptions.text);
    if (mailOptions.html) console.log("HTML:", mailOptions.html);
    console.log("===============================================");
    return { messageId: "dev-message-id", response: "logged-to-console" };
  },
} as any;

export const transporter = hasEmailCreds ? realTransporter : devTransporter;
