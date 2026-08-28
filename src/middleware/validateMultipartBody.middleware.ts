import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const validateMultipartBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let payload;
    try {
      payload = JSON.parse(req.body.data);
      console.log("📦 Parsed data from req.body.data");
    } catch {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    if (req.body.imageUrl) {
      payload.imageUrl = req.body.imageUrl;
      console.log("🖼️ Merged imageUrl into payload:", req.body.imageUrl);
    } else {
      console.log("⚠️ No imageUrl in req.body");
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      console.log("❌ Validation failed:", parsed.error.flatten());
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors: parsed.error.flatten(),
      });
    }

    console.log("✅ Validation success - final body:", parsed.data);
    req.body = parsed.data;
    next();
  };
};
