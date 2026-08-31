import {
  CreateServiceOptionInput,
  UpdateServiceOptionInput,
} from "@/validation/service.validate";
import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
export const createServiceOption = async (
  data: CreateServiceOptionInput,
  shopSlug: string,
  serviceId: string,
) => {
  const shop = await db.shop.findUnique({
    where: {
      slug: shopSlug,
    },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const service = await db.service.findUnique({
    where: {
      id: serviceId,
      shopId: shop.id,
    },
  });
  if (!service) throw new ApiError(404, "Service not found");
  const { values, ...rest } = data;
  const result = await db.serviceOption.create({
    data: {
      serviceId,
      ...rest,
      values: { create: data.values },
    },
    include: { values: true },
  });
  return result;
};
export const getServiceOptions = async (
  serviceId: string,
  shopSlug: string,
) => {
  console.log(shopSlug);
  const shop = await db.shop.findUnique({
    where: {
      slug: shopSlug,
    },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const service = await db.service.findUnique({
    where: {
      id: serviceId,
      shopId: shop.id,
    },
  });
  if (!service) throw new ApiError(404, "Service not found");
  const result = await db.serviceOption.findMany({
    where: {
      serviceId,
    },
    include: { values: true },
  });
  return result;
};
export const getServiceOptionById = async (
  optionId: string,
  shopSlug: string,
  serviceId: string,
) => {
  const shop = await db.shop.findUnique({
    where: {
      slug: shopSlug,
    },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const service = await db.service.findUnique({
    where: {
      id: serviceId,
      shopId: shop.id,
    },
  });
  if (!service) throw new ApiError(404, "Service not found");
  const option = await db.serviceOption.findUnique({
    where: {
      id: optionId,
    },
    include: { values: true },
  });
  if (!option) throw new ApiError(404, "Option not found");
  return option;
};
export const updateServiceOptionController = async (
  data: UpdateServiceOptionInput,
  shopSlug: string,
  serviceId: string,
  optionId: string,
) => {
  const shop = await db.shop.findUnique({
    where: {
      slug: shopSlug,
    },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const service = await db.service.findUnique({
    where: {
      id: serviceId,
      shopId: shop.id,
    },
  });
  if (!service) throw new ApiError(404, "Service not found");
  const option = await db.serviceOption.findUnique({
    where: {
      id: optionId,
      serviceId,
    },
  });
  if (!option) throw new ApiError(404, "Option not found");
  const { values: _values, ...optionData } = data;
  void _values;
  const result = await db.serviceOption.update({
    where: { id: optionId },
    data: optionData,
    include: { values: true },
  });
  return result;
};
export const deleteServiceOption = async (
  shopSlug: string,
  serviceId: string,
  optionId: string,
) => {
  const shop = await db.shop.findUnique({
    where: {
      slug: shopSlug,
    },
  });
  if (!shop) throw new ApiError(404, "Shop not found");
  const service = await db.service.findUnique({
    where: {
      id: serviceId,
      shopId: shop.id,
    },
  });
  if (!service) throw new ApiError(404, "Service not found");
  const option = await db.serviceOption.findUnique({
    where: {
      id: optionId,
      serviceId,
    },
  });
  if (!option) throw new ApiError(404, "Option not found");
  const result = await db.serviceOption.delete({
    where: {
      id: optionId,
    },
  });
  return result;
};
