import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/validation/service.validate';
import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
export const createCategory = async (
  data: CreateCategoryInput,
  shopSlug: string
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const result = await db.serviceCategory.create({
    data: {
      shopId: shop.id,
      ...data,
    },
  });
  return result;
};
export const updateCategory = async (id: string, data: UpdateCategoryInput) => {
  const result = await db.serviceCategory.update({
    where: { id },
    data,
  });
  return result;
};
export const deleteCategory = async (id: string) => {
  const result = await db.serviceCategory.delete({
    where: { id },
  });
  return result;
};
export const getCategories = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const result = await db.serviceCategory.findMany({
    where: { shopId: shop.id },
  });
  return result;
};
export const getCategoryById = async (id: string) => {
  const result = await db.serviceCategory.findUnique({
    where: { id },
  });
  if (!result) throw new ApiError(404, 'Category không tồn tại');
  return result;
};
