import { db } from "@/db/prisma";
import { serviceListCacheKey } from "@/cache/cacheKeys";
import { clearServiceListCache } from "@/cache/cacheInvalidation";
import { cacheAside } from "@/cache/cacheAside";
import { ApiError } from "@/utils/ApiError";
import {
  CreateServiceInput,
  UpdateServiceInput,
} from "@/validation/service.validate";
export const createService = async (
  data: CreateServiceInput,
  shopSlug: string,
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const { options, ...serviceFields } = data;
  const result = await db.service.create({
    data: {
      ...serviceFields,
      shopId: shop.id,
      options: options?.length
        ? {
            create: options.map((option) => ({
              name: option.name,
              isRequired: option.isRequired,
              sortOrder: option.sortOrder,
              values: {
                create: option.values.map((v) => ({
                  name: v.name,
                  price: v.price,
                  duration: v.duration,
                })),
              },
            })),
          }
        : undefined,
    },
    include: { options: { include: { values: true } } },
  });
  try { await clearServiceListCache(shopSlug); }
  catch (error) { console.error("[Redis] service cache invalidation failed:", error); }
  return result;
};
export interface ServiceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  category?: string;
  sort?: "RECENT" | "NAME_ASC" | "NAME_DESC" | "PRICE_ASC" | "PRICE_DESC" | "DURATION_ASC" | "DURATION_DESC";
}

export const getService = async (shopSlug: string, query: ServiceListQuery = {}) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const cacheKey = serviceListCacheKey(shopSlug, query);
  return cacheAside(cacheKey, async () => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 5));
    const search = query.search?.trim();
    const where: any = {
    shopId: shop.id,
    ...(query.status ? { isActive: query.status === "ACTIVE" } : {}),
    ...(query.category ? { categoryId: query.category } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ],
    } : {}),
    };
    const orderBy: any = query.sort === "NAME_ASC" ? { name: "asc" }
    : query.sort === "NAME_DESC" ? { name: "desc" }
    : query.sort === "PRICE_ASC" ? { basePrice: "asc" }
    : query.sort === "PRICE_DESC" ? { basePrice: "desc" }
    : query.sort === "DURATION_ASC" ? { durationMin: "asc" }
    : query.sort === "DURATION_DESC" ? { durationMin: "desc" }
    : { createdAt: "desc" };

    const [items, total, allCount, activeCount, inactiveCount, categoryRows] = await Promise.all([
    db.service.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: true,
        options: {
          include: { values: true },
          orderBy: { sortOrder: "asc" },
        },
        addons: true,
      },
    }),
    db.service.count({ where }),
    db.service.count({ where: { shopId: shop.id } }),
    db.service.count({ where: { shopId: shop.id, isActive: true } }),
    db.service.count({ where: { shopId: shop.id, isActive: false } }),
    db.service.findMany({ where: { shopId: shop.id }, select: { categoryId: true } }),
    ]);
    const totalPages = Math.ceil(total / limit);
    const result = {
    items,
    total,
    page: totalPages > 0 ? Math.min(page, totalPages) : 1,
    limit,
    totalPages,
    counts: {
      all: allCount,
      active: activeCount,
      inactive: inactiveCount,
      categories: new Set(categoryRows.map((row) => row.categoryId).filter(Boolean)).size,
    },
    };
    return result;
  });
};
export const getServiceById = async (shopSlug: string, serviceId: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const result = await db.service.findUnique({
    where: {
      id: serviceId,
    },
    include: {
      options: {
        include: {
          values: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
      addons: true,
    },
  });
  if (!result || result.shopId !== shop.id) {
    throw new ApiError(404, "Service not found");
  }
  return result;
};
export const deleteService = async (shopSlug: string, serviceId: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new ApiError(404, "Service not found");
  const result = await db.service.delete({
    where: {
      id: serviceId,
    },
  });
  try { await clearServiceListCache(shopSlug); }
  catch (error) { console.error("[Redis] service cache invalidation failed:", error); }
  return result;
};
export const updateService = async (
  shopSlug: string,
  serviceId: string,
  data: UpdateServiceInput,
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new ApiError(404, "Service not found");

  const {
    options,
    deleteOptionIds,
    deleteValueIds,
    addons,
    deleteAddonIds,
    ...serviceData
  } = data;

  await db.$transaction(async (tx) => {
    if (Object.keys(serviceData).length > 0) {
      await tx.service.update({
        where: { id: serviceId },
        data: serviceData,
      });
    }

    if (deleteValueIds && deleteValueIds.length > 0) {
      await tx.optionValue.deleteMany({
        where: {
          id: { in: deleteValueIds },
        },
      });
    }

    if (deleteOptionIds && deleteOptionIds.length > 0) {
      await tx.serviceOption.deleteMany({
        where: {
          id: { in: deleteOptionIds },
          serviceId,
        },
      });
    }

    if (options && options.length > 0) {
      for (const option of options) {
        const { id: optionId, values, ...optionData } = option;

        if (optionId) {
          await tx.serviceOption.update({
            where: { id: optionId },
            data: optionData,
          });

          for (const value of values) {
            const { id: valueId, ...valueData } = value;
            if (valueId) {
              await tx.optionValue.update({
                where: { id: valueId },
                data: valueData,
              });
            } else {
              await tx.optionValue.create({
                data: {
                  ...valueData,
                  optionId,
                },
              });
            }
          }
        } else {
          await tx.serviceOption.create({
            data: {
              ...optionData,
              serviceId,
              values: {
                create: values.map(({ id, ...v }: any) => v),
              },
            },
          });
        }
      }
    }
    if (deleteAddonIds && deleteAddonIds.length > 0) {
      await tx.addonService.deleteMany({
        where: {
          id: { in: deleteAddonIds },
          serviceId,
        },
      });
    }
    if (addons && addons.length > 0) {
      for (const addon of addons) {
        const { id: addonId, ...addonData } = addon;
        if (addonId) {
          await tx.addonService.update({
            where: { id: addonId },
            data: addonData,
          });
        } else {
          await tx.addonService.create({
            data: {
              ...addonData,
              serviceId,
              shopId: shop.id,
            },
          });
        }
      }
    }
  });
  const result = await db.service.findUnique({
    where: { id: serviceId },
    include: {
      options: {
        include: { values: true },
        orderBy: { sortOrder: "asc" },
      },
      addons: true,
    },
  });

  try { await clearServiceListCache(shopSlug); }
  catch (error) { console.error("[Redis] service cache invalidation failed:", error); }
  return result;
};
export const countService = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const count = await db.service.count({
    where: { shopId: shop.id },
  });
  return count;
};
