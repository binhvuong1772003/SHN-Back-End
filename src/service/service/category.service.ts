import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/validation/service.validate";
import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
export const createCategory = async (
  data: CreateCategoryInput,
  shopSlug: string,
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
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
export interface CategoryListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  sort?: "RECENT" | "NAME_ASC" | "NAME_DESC" | "ORDER_ASC";
}

export const getCategories = async (
  shopSlug: string,
  query: CategoryListQuery = {},
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const search = query.search?.trim();
  const where = {
    shopId: shop.id,
    ...(query.status ? { isActive: query.status === "ACTIVE" } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };
  const orderBy =
    query.sort === "NAME_ASC"
      ? { name: "asc" as const }
      : query.sort === "NAME_DESC"
        ? { name: "desc" as const }
        : query.sort === "RECENT"
          ? { createdAt: "desc" as const }
          : { sortOrder: "asc" as const };

  const [items, total] = await Promise.all([
    db.serviceCategory.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { services: true } } },
    }),
    db.serviceCategory.count({ where }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return {
    items: items.map(({ _count, ...category }) => ({
      ...category,
      serviceCount: _count.services,
    })),
    total,
    page: totalPages > 0 ? Math.min(page, totalPages) : 1,
    limit,
    totalPages,
  };
};
export const getCategoryById = async (id: string) => {
  const result = await db.serviceCategory.findUnique({
    where: { id },
  });
  if (!result) throw new ApiError(404, "Category not found");
  return result;
};
