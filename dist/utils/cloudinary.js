"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = exports.CLOUDINARY_FOLDERS = void 0;
const cloudinary_1 = require("cloudinary");
exports.CLOUDINARY_FOLDERS = {
    SHOP_LOGO: "shn/shops/logo",
    SHOP_COVER: "shn/shops/cover",
    SERVICE_IMAGE: "shn/services/images",
};
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
const uploadToCloudinary = async (file, folder, publicId) => {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    return await cloudinary_1.v2.uploader.upload(base64, {
        folder,
        public_id: publicId,
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = async (publicId) => {
    return await cloudinary_1.v2.uploader.destroy(publicId);
};
exports.deleteFromCloudinary = deleteFromCloudinary;
