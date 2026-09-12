import type { Prisma } from "@prisma/client";
import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import type {
  CreateServiceReviewInput,
  CreateShopReviewInput,
  CreateStaffReviewInput,
  ReviewListQuery,
  UpdateReviewInput,
} from "@/validation/review.validate";

const reviewSelect = {
  id: true,
  appointmentId: true,
  rating: true,
  comment: true,
  imageUrls: true,
  isPublic: true,
  replyContent: true,
  repliedAt: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { name: true, avatarUrl: true } },
} satisfies Prisma.ShopReviewSelect;

const staffReviewSelect = {
  ...reviewSelect,
  shopStaffId: true,
  staff: {
    select: { id: true, nickname: true, avatarUrl: true },
  },
} satisfies Prisma.StaffReviewSelect;

const serviceReviewSelect = {
  ...reviewSelect,
  appointmentServiceId: true,
  serviceId: true,
  service: { select: { id: true, name: true, imageUrl: true } },
} satisfies Prisma.ServiceReviewSelect;

const getShop = async (shopSlug: string) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");
  return shop;
};

const assertCompletedAppointment = (status: string) => {
  if (status !== "COMPLETED") {
    throw new ApiError(409, "Only completed appointments can be reviewed");
  }
};

const getPagination = (query: ReviewListQuery) => {
  const page = Math.max(1, query.page);
  const limit = Math.min(100, Math.max(1, query.limit));
  return { page, limit };
};

const paginationMeta = (total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  return {
    page: safePage,
    limit,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
};

const refreshShopRating = async (client: Prisma.TransactionClient, shopId: string) => {
  const summary = await client.shopReview.aggregate({
    where: { shopId, isPublic: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await client.shop.update({
    where: { id: shopId },
    data: {
      ratingAverage: summary._avg.rating ?? 0,
      ratingCount: summary._count._all,
    },
  });
};

const refreshStaffRating = async (
  client: Prisma.TransactionClient,
  shopStaffId: string,
) => {
  const summary = await client.staffReview.aggregate({
    where: { shopStaffId, isPublic: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await client.shopStaff.update({
    where: { id: shopStaffId },
    data: {
      avgRating: summary._avg.rating ?? 0,
      totalRatings: summary._count._all,
    },
  });
};

const refreshServiceRating = async (
  client: Prisma.TransactionClient,
  serviceId: string,
) => {
  const summary = await client.serviceReview.aggregate({
    where: { serviceId, isPublic: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await client.service.update({
    where: { id: serviceId },
    data: {
      ratingAverage: summary._avg.rating ?? 0,
      ratingCount: summary._count._all,
    },
  });
};

const assertReviewOwner = (customerId: string, actorUserId: string) => {
  if (!actorUserId) throw new ApiError(401, "Unauthorized");
  if (customerId !== actorUserId) {
    throw new ApiError(403, "You can only modify your own review");
  }
};

export const createShopReview = async (
  shopSlug: string,
  actorUserId: string,
  input: CreateShopReviewInput,
) => {
  if (!actorUserId) throw new ApiError(401, "Unauthorized");
  const shop = await getShop(shopSlug);
  const appointment = await db.appointment.findFirst({
    where: { id: input.appointmentId, shopId: shop.id },
    select: { id: true, customerId: true, status: true },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (appointment.customerId !== actorUserId) {
    throw new ApiError(403, "Only the appointment customer can create this review");
  }
  assertCompletedAppointment(appointment.status);
  const existing = await db.shopReview.findUnique({ where: { appointmentId: appointment.id } });
  if (existing) throw new ApiError(409, "A shop review already exists for this appointment");

  return db.$transaction(async (tx) => {
    const review = await tx.shopReview.create({
      data: {
        appointmentId: appointment.id,
        customerId: actorUserId,
        shopId: shop.id,
        rating: input.rating,
        comment: input.comment,
        imageUrls: input.imageUrls ?? [],
      },
      select: reviewSelect,
    });
    await refreshShopRating(tx, shop.id);
    return review;
  });
};

export const createStaffReview = async (
  shopSlug: string,
  actorUserId: string,
  input: CreateStaffReviewInput,
) => {
  if (!actorUserId) throw new ApiError(401, "Unauthorized");
  const shop = await getShop(shopSlug);
  const appointment = await db.appointment.findFirst({
    where: { id: input.appointmentId, shopId: shop.id },
    select: { id: true, customerId: true, status: true, staffId: true },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (appointment.customerId !== actorUserId) {
    throw new ApiError(403, "Only the appointment customer can create this review");
  }
  assertCompletedAppointment(appointment.status);
  if (!appointment.staffId) throw new ApiError(409, "This appointment has no assigned staff");
  const existing = await db.staffReview.findUnique({ where: { appointmentId: appointment.id } });
  if (existing) throw new ApiError(409, "A staff review already exists for this appointment");

  return db.$transaction(async (tx) => {
    const review = await tx.staffReview.create({
      data: {
        appointmentId: appointment.id,
        customerId: actorUserId,
        shopId: shop.id,
        shopStaffId: appointment.staffId as string,
        rating: input.rating,
        comment: input.comment,
        imageUrls: input.imageUrls ?? [],
      },
      select: staffReviewSelect,
    });
    await refreshStaffRating(tx, appointment.staffId as string);
    return review;
  });
};

export const createServiceReview = async (
  shopSlug: string,
  actorUserId: string,
  input: CreateServiceReviewInput,
) => {
  if (!actorUserId) throw new ApiError(401, "Unauthorized");
  const shop = await getShop(shopSlug);
  const appointmentService = await db.appointmentService.findUnique({
    where: { id: input.appointmentServiceId },
    select: {
      id: true,
      appointmentId: true,
      serviceId: true,
      appointment: { select: { shopId: true, customerId: true, status: true } },
      service: { select: { shopId: true } },
    },
  });
  if (!appointmentService || appointmentService.appointment.shopId !== shop.id) {
    throw new ApiError(404, "Appointment service not found");
  }
  if (appointmentService.service.shopId !== shop.id) {
    throw new ApiError(409, "The service does not belong to this shop");
  }
  if (appointmentService.appointment.customerId !== actorUserId) {
    throw new ApiError(403, "Only the appointment customer can create this review");
  }
  assertCompletedAppointment(appointmentService.appointment.status);
  const existing = await db.serviceReview.findUnique({
    where: { appointmentServiceId: appointmentService.id },
  });
  if (existing) throw new ApiError(409, "A service review already exists for this appointment service");

  return db.$transaction(async (tx) => {
    const review = await tx.serviceReview.create({
      data: {
        appointmentId: appointmentService.appointmentId,
        appointmentServiceId: appointmentService.id,
        customerId: actorUserId,
        shopId: shop.id,
        serviceId: appointmentService.serviceId,
        rating: input.rating,
        comment: input.comment,
        imageUrls: input.imageUrls ?? [],
      },
      select: serviceReviewSelect,
    });
    await refreshServiceRating(tx, appointmentService.serviceId);
    return review;
  });
};

export const listShopReviews = async (shopSlug: string, query: ReviewListQuery) => {
  const shop = await getShop(shopSlug);
  const { page, limit } = getPagination(query);
  const where = { shopId: shop.id, isPublic: true };
  const [total, items] = await Promise.all([
    db.shopReview.count({ where }),
    db.shopReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: reviewSelect,
    }),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
};

export const listStaffReviews = async (
  shopSlug: string,
  staffId: string,
  query: ReviewListQuery,
) => {
  const shop = await getShop(shopSlug);
  const staff = await db.shopStaff.findFirst({ where: { id: staffId, shopId: shop.id }, select: { id: true } });
  if (!staff) throw new ApiError(404, "Staff member not found");
  const { page, limit } = getPagination(query);
  const where = { shopId: shop.id, shopStaffId: staff.id, isPublic: true };
  const [total, items] = await Promise.all([
    db.staffReview.count({ where }),
    db.staffReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: staffReviewSelect,
    }),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
};

export const listServiceReviews = async (
  shopSlug: string,
  serviceId: string,
  query: ReviewListQuery,
) => {
  const shop = await getShop(shopSlug);
  const service = await db.service.findFirst({ where: { id: serviceId, shopId: shop.id }, select: { id: true } });
  if (!service) throw new ApiError(404, "Service not found");
  const { page, limit } = getPagination(query);
  const where = { shopId: shop.id, serviceId: service.id, isPublic: true };
  const [total, items] = await Promise.all([
    db.serviceReview.count({ where }),
    db.serviceReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: serviceReviewSelect,
    }),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
};

export const getShopReview = async (shopSlug: string, reviewId: string) => {
  const shop = await getShop(shopSlug);
  const review = await db.shopReview.findFirst({ where: { id: reviewId, shopId: shop.id }, select: reviewSelect });
  if (!review) throw new ApiError(404, "Shop review not found");
  return review;
};

export const getStaffReview = async (shopSlug: string, staffId: string, reviewId: string) => {
  const shop = await getShop(shopSlug);
  const review = await db.staffReview.findFirst({ where: { id: reviewId, shopId: shop.id, shopStaffId: staffId }, select: staffReviewSelect });
  if (!review) throw new ApiError(404, "Staff review not found");
  return review;
};

export const getServiceReview = async (shopSlug: string, serviceId: string, reviewId: string) => {
  const shop = await getShop(shopSlug);
  const review = await db.serviceReview.findFirst({ where: { id: reviewId, shopId: shop.id, serviceId }, select: serviceReviewSelect });
  if (!review) throw new ApiError(404, "Service review not found");
  return review;
};

export const updateShopReview = async (shopSlug: string, reviewId: string, actorUserId: string, input: UpdateReviewInput) => {
  const shop = await getShop(shopSlug);
  const existing = await db.shopReview.findFirst({ where: { id: reviewId, shopId: shop.id } });
  if (!existing) throw new ApiError(404, "Shop review not found");
  assertReviewOwner(existing.customerId, actorUserId);
  return db.$transaction(async (tx) => {
    const review = await tx.shopReview.update({ where: { id: reviewId }, data: input, select: reviewSelect });
    await refreshShopRating(tx, shop.id);
    return review;
  });
};

export const updateStaffReview = async (shopSlug: string, staffId: string, reviewId: string, actorUserId: string, input: UpdateReviewInput) => {
  const shop = await getShop(shopSlug);
  const existing = await db.staffReview.findFirst({ where: { id: reviewId, shopId: shop.id, shopStaffId: staffId } });
  if (!existing) throw new ApiError(404, "Staff review not found");
  assertReviewOwner(existing.customerId, actorUserId);
  return db.$transaction(async (tx) => {
    const review = await tx.staffReview.update({ where: { id: reviewId }, data: input, select: staffReviewSelect });
    await refreshStaffRating(tx, staffId);
    return review;
  });
};

export const updateServiceReview = async (shopSlug: string, serviceId: string, reviewId: string, actorUserId: string, input: UpdateReviewInput) => {
  const shop = await getShop(shopSlug);
  const existing = await db.serviceReview.findFirst({ where: { id: reviewId, shopId: shop.id, serviceId } });
  if (!existing) throw new ApiError(404, "Service review not found");
  assertReviewOwner(existing.customerId, actorUserId);
  return db.$transaction(async (tx) => {
    const review = await tx.serviceReview.update({ where: { id: reviewId }, data: input, select: serviceReviewSelect });
    await refreshServiceRating(tx, serviceId);
    return review;
  });
};

export const deleteShopReview = async (shopSlug: string, reviewId: string, actorUserId: string) => {
  const shop = await getShop(shopSlug);
  const existing = await db.shopReview.findFirst({ where: { id: reviewId, shopId: shop.id } });
  if (!existing) throw new ApiError(404, "Shop review not found");
  assertReviewOwner(existing.customerId, actorUserId);
  await db.$transaction(async (tx) => {
    await tx.shopReview.delete({ where: { id: reviewId } });
    await refreshShopRating(tx, shop.id);
  });
};

export const deleteStaffReview = async (shopSlug: string, staffId: string, reviewId: string, actorUserId: string) => {
  const shop = await getShop(shopSlug);
  const existing = await db.staffReview.findFirst({ where: { id: reviewId, shopId: shop.id, shopStaffId: staffId } });
  if (!existing) throw new ApiError(404, "Staff review not found");
  assertReviewOwner(existing.customerId, actorUserId);
  await db.$transaction(async (tx) => {
    await tx.staffReview.delete({ where: { id: reviewId } });
    await refreshStaffRating(tx, staffId);
  });
};

export const deleteServiceReview = async (shopSlug: string, serviceId: string, reviewId: string, actorUserId: string) => {
  const shop = await getShop(shopSlug);
  const existing = await db.serviceReview.findFirst({ where: { id: reviewId, shopId: shop.id, serviceId } });
  if (!existing) throw new ApiError(404, "Service review not found");
  assertReviewOwner(existing.customerId, actorUserId);
  await db.$transaction(async (tx) => {
    await tx.serviceReview.delete({ where: { id: reviewId } });
    await refreshServiceRating(tx, serviceId);
  });
};
