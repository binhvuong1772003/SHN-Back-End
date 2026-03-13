import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY_FOLDERS = {
  SHOP_LOGO: 'shn/shops/logo', // ← thêm
  SHOP_COVER: 'shn/shops/cover', // ← thêm
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string,
  publicId?: string
) => {
  const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  return await cloudinary.uploader.upload(base64, {
    folder,
    public_id: publicId,
  });
};

export const deleteFromCloudinary = async (publicId: string) => {
  return await cloudinary.uploader.destroy(publicId);
};
