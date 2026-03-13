import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  createServiceSchema,
  CreateServiceInput,
  UpdateServiceInput,
} from '@/validation/service.validate';
export const createService = async (
  data: CreateServiceInput,
  shopSlug: string
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const result = await db.service.create({
    data: {
      ...data,
      shopId: shop.id,
    },
  });
  return result;
};
export const getService = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const result = await db.service.findMany({
    where: {
      shopId: shop.id,
    },
    include: {
      options: {
        include: {
          values: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      },
      addons: true,
    },
  });
  return result;
};
export const getServiceById = async (shopSlug: string, serviceId: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
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
          sortOrder: 'asc',
        },
      },
      addons: true,
    },
  });
  if (!result || result.shopId !== shop.id) {
    throw new ApiError(404, 'Service không tồn tại');
  }
  return result;
};
export const deleteService = async (shopSlug: string, serviceId: string) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new ApiError(404, 'Service không tồn tại');
  const result = await db.service.delete({
    where: {
      id: serviceId,
    },
  });
  return result;
};
export const updateService = async (
  shopSlug: string,
  serviceId: string,
  data: UpdateServiceInput
) => {
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop không tồn tại');
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new ApiError(404, 'Service không tồn tại');

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
        orderBy: { sortOrder: 'asc' },
      },
      addons: true,
    },
  });

  return result;
};
