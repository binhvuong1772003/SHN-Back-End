// service/addonService.service.ts
import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';

interface CreateAddonInput {
  name: string;
  price: number;
  duration?: number;
  isActive?: boolean;
  sortOrder?: number;
  serviceId?: string;
}

export const createAddonService = async (
  shopSlug: string,
  data: CreateAddonInput
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  // Validate serviceId when provided.
  if (data.serviceId) {
    const service = await db.service.findUnique({
      where: { id: data.serviceId, shopId: shop.id },
    });
    if (!service) throw new ApiError(404, 'Service not found');
  }

  return db.addonService.create({
    data: {
      ...data,
      shopId: shop.id,
    },
  });
};

export const getAddonServices = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  return db.addonService.findMany({
    where: { shopId: shop.id },
    include: { service: { select: { id: true, name: true } } },
    orderBy: { sortOrder: 'asc' },
  });
};

export const getAddonServiceById = async (
  shopSlug: string,
  addonId: string
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const addon = await db.addonService.findUnique({
    where: { id: addonId },
    include: { service: { select: { id: true, name: true } } },
  });

  if (!addon || addon.shopId !== shop.id) {
    throw new ApiError(404, 'Addon not found');
  }

  return addon;
};

export const updateAddonService = async (
  shopSlug: string,
  addonId: string,
  data: Partial<CreateAddonInput>
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const addon = await db.addonService.findUnique({ where: { id: addonId } });
  if (!addon || addon.shopId !== shop.id) {
    throw new ApiError(404, 'Addon not found');
  }

  if (data.serviceId) {
    const service = await db.service.findUnique({
      where: { id: data.serviceId, shopId: shop.id },
    });
    if (!service) throw new ApiError(404, 'Service not found');
  }

  return db.addonService.update({
    where: { id: addonId },
    data,
    include: { service: { select: { id: true, name: true } } },
  });
};

export const deleteAddonService = async (shopSlug: string, addonId: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop not found');

  const addon = await db.addonService.findUnique({ where: { id: addonId } });
  if (!addon || addon.shopId !== shop.id) {
    throw new ApiError(404, 'Addon not found');
  }

  return db.addonService.delete({ where: { id: addonId } });
};
