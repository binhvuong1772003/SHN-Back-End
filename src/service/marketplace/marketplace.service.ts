import { db } from "@/db/prisma";
import type { Prisma, ShopType } from "@prisma/client";
import { ApiError } from "@/utils/ApiError";
import { getAvailableSlots } from "@/service/calendar/calendar.service";

export interface PublicMarketplaceQuery {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  type?: ShopType;
}

export const getPublicMarketplaceShops = async (
  query: PublicMarketplaceQuery = {},
) => {
  const requestedPage = Number(query.page);
  const requestedLimit = Number(query.limit);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(24, requestedLimit)
    : 12;
  const search = query.search?.trim().slice(0, 100) || undefined;
  const city = query.city?.trim().slice(0, 100) || undefined;

  const conditions: Prisma.ShopWhereInput[] = [{ status: "ACTIVE" }];
  if (query.type) conditions.push({ type: query.type });
  if (city) {
    conditions.push({
      OR: [
        { city: { contains: city, mode: "insensitive" } },
        { district: { contains: city, mode: "insensitive" } },
        { address: { contains: city, mode: "insensitive" } },
      ],
    });
  }
  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          services: {
            some: {
              isActive: true,
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }

  const where: Prisma.ShopWhereInput = { AND: conditions };
  const total = await db.shop.count({ where });
  const totalPages = Math.ceil(total / limit);
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;

  const items = await db.shop.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (safePage - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        city: true,
        district: true,
        logoUrl: true,
        coverUrl: true,
        timezone: true,
        description: true,
        ratingAverage: true,
        ratingCount: true,
        services: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          take: 12,
          select: {
            id: true,
            shopId: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
            name: true,
            description: true,
            basePrice: true,
            durationMin: true,
            imageUrl: true,
            isActive: true,
            sortOrder: true,
            ratingAverage: true,
            ratingCount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

  const matchedServices = search && items.length
    ? await db.service.findMany({
        where: {
          shopId: { in: items.map((shop) => shop.id) },
          isActive: true,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }, { id: "asc" }],
        select: { id: true, shopId: true, name: true, basePrice: true, durationMin: true },
      })
    : [];
  const matchedByShop = new Map<string, typeof matchedServices>();
  for (const service of matchedServices) {
    const current = matchedByShop.get(service.shopId) ?? [];
    if (current.length < 3) current.push(service);
    matchedByShop.set(service.shopId, current);
  }

  return {
    items: items.map((shop) => ({
      ...shop,
      ...(search ? { matchedServices: matchedByShop.get(shop.id) ?? [] } : {}),
    })),
    meta: {
      total,
      page: safePage,
      limit,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
};

/**
 * Public shop projection. Keep this separate from the authenticated shop
 * detail endpoint so private/customer/operational fields never cross the
 * public boundary.
 */
export const getPublicShopBySlug = async (shopSlug: string) => {
  const shop = await db.shop.findFirst({
    where: { slug: shopSlug, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      district: true,
      description: true,
      logoUrl: true,
      coverUrl: true,
      openTime: true,
      closeTime: true,
      workDays: true,
      timezone: true,
      ratingAverage: true,
      ratingCount: true,
      businessHours: {
        orderBy: { dayOfWeek: "asc" },
        select: {
          dayOfWeek: true,
          openTime: true,
          closeTime: true,
          isClosed: true,
        },
      },
      services: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          shopId: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
          name: true,
          description: true,
          basePrice: true,
          durationMin: true,
          imageUrl: true,
          isActive: true,
          sortOrder: true,
          ratingAverage: true,
          ratingCount: true,
          createdAt: true,
          updatedAt: true,
          options: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              serviceId: true,
              name: true,
              isRequired: true,
              sortOrder: true,
              values: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  name: true,
                  price: true,
                  duration: true,
                  sortOrder: true,
                },
              },
            },
          },
        },
      },
      staffMembers: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          nickname: true,
          bio: true,
          avatarUrl: true,
          avgRating: true,
          totalRatings: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
      shopReviews: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          rating: true,
          comment: true,
          replyContent: true,
          repliedAt: true,
          createdAt: true,
          customer: { select: { name: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!shop) throw new ApiError(404, "Shop not found");

  const rating = await db.shopReview.aggregate({
    where: { shopId: shop.id, isPublic: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const { shopReviews, ...publicShop } = shop;
  return {
    ...publicShop,
    reviews: shopReviews,
    rating: {
      average: rating._avg.rating ?? null,
      count: rating._count._all,
    },
  };
};

export const getPublicShopAvailability = async (input: {
  shopSlug: string;
  date: string;
  durationMin: number;
  staffId?: string;
}) => {
  // Reuse the same slot validation used at booking time. The public endpoint
  // only exposes availability; the create endpoint still revalidates before
  // writing an appointment.
  return getAvailableSlots(input);
};

export const getPublicShopReviews = async (
  shopSlug: string,
  query: { page?: number; limit?: number } = {},
) => {
  const shop = await db.shop.findFirst({
    where: { slug: shopSlug, status: "ACTIVE" },
    select: { id: true },
  });
  if (!shop) throw new ApiError(404, "Shop not found");

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(20, Math.max(1, Number(query.limit) || 8));
  const where = { shopId: shop.id, isPublic: true };
  const [total, items] = await Promise.all([
    db.shopReview.count({ where }),
    db.shopReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        replyContent: true,
        repliedAt: true,
        createdAt: true,
        customer: { select: { name: true, avatarUrl: true } },
      },
    }),
  ]);
  const totalPages = Math.ceil(total / limit);
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  return {
    items,
    meta: {
      total,
      page: safePage,
      limit,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
};
