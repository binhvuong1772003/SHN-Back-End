import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import type {
  CreateShopInput,
  UpdateShopInput,
} from '@/validation/shop.validate';
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/cloudinary';
export const createShopService = async (
  data: CreateShopInput,
  ownerId: string
) => {
  if (!ownerId) throw new ApiError(401, 'Unauthorized');
  const existing = await db.shop.findUnique({
    where: { slug: data.slug },
  });
  if (existing) throw new ApiError(400, 'Shop đã tồn tại');
  const shop = await db.shop.create({
    data: {
      ...data,
      ownerId,
      staffMembers: {
        create: {
          userId: ownerId,
          role: 'OWNER',
        },
      },
    },
  });
  await db.user.update({
    where: { id: ownerId },
    data: { role: 'SHOP_MEMBER' },
  });
  return shop;
};
export const getListShopService = async (ownerId: string) => {
  if (!ownerId) throw new ApiError(401, 'Unauthorized');
  return db.shop.findMany({
    where: { ownerId },
  });
};
export const updateShopService = async (
  shopSlug: string,
  data: UpdateShopInput
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop not found');
  return db.shop.update({
    where: { slug: shopSlug },
    data,
  });
};
export const uploadShopLogoService = async (
  file: Express.Multer.File,
  folder: string,
  shopSlug: string
) => {
  if (!file) throw new ApiError(400, 'File not found');
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.logoPublicId) await deleteFromCloudinary(shop.logoPublicId);
  const result = await uploadToCloudinary(file, folder, `${shopSlug}_logo`);
  return await db.shop.update({
    where: { slug: shopSlug },
    data: {
      logoUrl: result.secure_url,
      logoPublicId: result.public_id,
    },
  });
};
export const uploadShopBannerService = async (
  file: Express.Multer.File,
  folder: string,
  shopSlug: string
) => {
  if (!file) throw new ApiError(400, 'File not found');
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop not found');
  if (shop.coverPublicId) await deleteFromCloudinary(shop.coverPublicId);
  const result = await uploadToCloudinary(file, folder, `${shopSlug}_logo`);
  return await db.shop.update({
    where: { slug: shopSlug },
    data: {
      coverUrl: result.secure_url,
      coverPublicId: result.public_id,
    },
  });
};
