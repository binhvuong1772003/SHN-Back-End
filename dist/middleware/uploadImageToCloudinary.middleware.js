"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadServiceImage = exports.uploadImageToCloudinary = void 0;
const cloudinary_1 = require("../utils/cloudinary");
const uploadImageToCloudinary = (folder) => {
    return async (req, res, next) => {
        try {
            console.log("📸 Upload middleware - req.file:", req.file ? "EXISTS" : "NULL");
            if (req.file) {
                console.log("📤 Uploading to Cloudinary...");
                const result = await (0, cloudinary_1.uploadToCloudinary)(req.file, folder);
                req.body.imageUrl = result.secure_url;
                console.log("✅ Upload success - imageUrl:", result.secure_url);
            }
            next();
        }
        catch (error) {
            console.error("❌ Upload error:", error);
            next(error);
        }
    };
};
exports.uploadImageToCloudinary = uploadImageToCloudinary;
exports.uploadServiceImage = (0, exports.uploadImageToCloudinary)(cloudinary_1.CLOUDINARY_FOLDERS.SERVICE_IMAGE);
