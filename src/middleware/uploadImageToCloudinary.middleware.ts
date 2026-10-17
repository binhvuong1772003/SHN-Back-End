import { NextFunction, Request, Response } from "express";
import { uploadToCloudinary, CLOUDINARY_FOLDERS } from "@/utils/cloudinary";

export const uploadImageToCloudinary = (folder: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(
        "📸 Upload middleware - req.file:",
        req.file ? "EXISTS" : "NULL",
      );
      if (req.file) {
        console.log("📤 Uploading to Cloudinary...");
        const result = await uploadToCloudinary(req.file, folder);
        req.body.imageUrl = result.secure_url;
        console.log("✅ Upload success - imageUrl:", result.secure_url);
      }
      next();
    } catch (error) {
      console.error("❌ Upload error:", error);
      next(error);
    }
  };
};

export const uploadServiceImage = uploadImageToCloudinary(
  CLOUDINARY_FOLDERS.SERVICE_IMAGE,
);
