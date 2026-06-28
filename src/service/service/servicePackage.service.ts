import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { CreateServicePackageInput } from '@/validation/service.validate';

export const createServicePackage = async (
  data: CreateServicePackageInput,
  shopSlug: string
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');

  const { items, addons, ...packageData } = data;

  const result = await db.servicePackage.create({
    data: {
      ...packageData,
      shopId: shop.id,
      items: {
        create: items.map((item) => ({
          serviceId: item.serviceId,
          optionValueId: item.optionValueId,
          isIncluded: item.isIncluded ?? true,
        })),
      },
      addons: addons
        ? {
            create: addons.map((addon) => ({
              addonId: addon.addonId, // ← đổi từ optionValueId sang addonId
              extraPrice: addon.extraPrice,
            })),
          }
        : undefined,
    },
    include: {
      items: {
        include: {
          service: true,
          optionValue: true,
        },
      },
      addons: {
        include: { addon: true }, // ← đổi từ optionValue sang addon
      },
    },
  });

  return result;
};

export const getServicePackages = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');

  return db.servicePackage.findMany({
    where: { shopId: shop.id },
    include: {
      items: {
        include: {
          service: true,
          optionValue: true,
        },
      },
      addons: {
        include: { addon: true },
      },
    },
  });
};

export const getServicePackageById = async (
  shopSlug: string,
  packageId: string
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');

  const result = await db.servicePackage.findUnique({
    where: { id: packageId },
    include: {
      items: {
        include: {
          service: true,
          optionValue: true,
        },
      },
      addons: {
        include: { addon: true },
      },
    },
  });

  if (!result || result.shopId !== shop.id) {
    throw new ApiError(404, 'Package không tồn tại');
  }

  return result;
};

export const updateServicePackage = async (
  shopSlug: string,
  packageId: string,
  data: Partial<CreateServicePackageInput>
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');

  const existing = await db.servicePackage.findUnique({
    where: { id: packageId },
  });
  if (!existing || existing.shopId !== shop.id) {
    throw new ApiError(404, 'Package không tồn tại');
  }

  const { items, addons, ...packageData } = data;

  await db.$transaction(async (tx) => {
    if (Object.keys(packageData).length > 0) {
      await tx.servicePackage.update({
        where: { id: packageId },
        data: packageData,
      });
    }

    if (items) {
      await tx.servicePackageItem.deleteMany({ where: { packageId } });
      await tx.servicePackageItem.createMany({
        data: items.map((item) => ({
          packageId,
          serviceId: item.serviceId,
          optionValueId: item.optionValueId,
          isIncluded: item.isIncluded ?? true,
        })),
      });
    }

    if (addons) {
      await tx.packageAddon.deleteMany({ where: { packageId } });
      await tx.packageAddon.createMany({
        data: addons.map((addon) => ({
          packageId,
          addonId: addon.addonId,
          extraPrice: addon.extraPrice,
        })),
      });
    }
  });

  return db.servicePackage.findUnique({
    where: { id: packageId },
    include: {
      items: { include: { service: true, optionValue: true } },
      addons: { include: { addon: true } },
    },
  });
};

export const deleteServicePackage = async (
  shopSlug: string,
  packageId: string
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');

  const existing = await db.servicePackage.findUnique({
    where: { id: packageId },
  });
  if (!existing || existing.shopId !== shop.id) {
    throw new ApiError(404, 'Package không tồn tại');
  }

  return db.servicePackage.delete({ where: { id: packageId } });
};
