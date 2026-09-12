"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServiceReview = exports.deleteStaffReview = exports.deleteShopReview = exports.updateServiceReview = exports.updateStaffReview = exports.updateShopReview = exports.getServiceReview = exports.getStaffReview = exports.getShopReview = exports.listServiceReviews = exports.listStaffReviews = exports.listShopReviews = exports.createServiceReview = exports.createStaffReview = exports.createShopReview = void 0;
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
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
};
const staffReviewSelect = {
    ...reviewSelect,
    shopStaffId: true,
    staff: {
        select: { id: true, nickname: true, avatarUrl: true },
    },
};
const serviceReviewSelect = {
    ...reviewSelect,
    appointmentServiceId: true,
    serviceId: true,
    service: { select: { id: true, name: true, imageUrl: true } },
};
const getShop = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    return shop;
};
const assertCompletedAppointment = (status) => {
    if (status !== "COMPLETED") {
        throw new ApiError_1.ApiError(409, "Only completed appointments can be reviewed");
    }
};
const getPagination = (query) => {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    return { page, limit };
};
const paginationMeta = (total, page, limit) => {
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
const refreshShopRating = async (client, shopId) => {
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
const refreshStaffRating = async (client, shopStaffId) => {
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
const refreshServiceRating = async (client, serviceId) => {
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
const assertReviewOwner = (customerId, actorUserId) => {
    if (!actorUserId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    if (customerId !== actorUserId) {
        throw new ApiError_1.ApiError(403, "You can only modify your own review");
    }
};
const createShopReview = async (shopSlug, actorUserId, input) => {
    if (!actorUserId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const shop = await getShop(shopSlug);
    const appointment = await prisma_1.db.appointment.findFirst({
        where: { id: input.appointmentId, shopId: shop.id },
        select: { id: true, customerId: true, status: true },
    });
    if (!appointment)
        throw new ApiError_1.ApiError(404, "Appointment not found");
    if (appointment.customerId !== actorUserId) {
        throw new ApiError_1.ApiError(403, "Only the appointment customer can create this review");
    }
    assertCompletedAppointment(appointment.status);
    const existing = await prisma_1.db.shopReview.findUnique({ where: { appointmentId: appointment.id } });
    if (existing)
        throw new ApiError_1.ApiError(409, "A shop review already exists for this appointment");
    return prisma_1.db.$transaction(async (tx) => {
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
exports.createShopReview = createShopReview;
const createStaffReview = async (shopSlug, actorUserId, input) => {
    if (!actorUserId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const shop = await getShop(shopSlug);
    const appointment = await prisma_1.db.appointment.findFirst({
        where: { id: input.appointmentId, shopId: shop.id },
        select: { id: true, customerId: true, status: true, staffId: true },
    });
    if (!appointment)
        throw new ApiError_1.ApiError(404, "Appointment not found");
    if (appointment.customerId !== actorUserId) {
        throw new ApiError_1.ApiError(403, "Only the appointment customer can create this review");
    }
    assertCompletedAppointment(appointment.status);
    if (!appointment.staffId)
        throw new ApiError_1.ApiError(409, "This appointment has no assigned staff");
    const existing = await prisma_1.db.staffReview.findUnique({ where: { appointmentId: appointment.id } });
    if (existing)
        throw new ApiError_1.ApiError(409, "A staff review already exists for this appointment");
    return prisma_1.db.$transaction(async (tx) => {
        const review = await tx.staffReview.create({
            data: {
                appointmentId: appointment.id,
                customerId: actorUserId,
                shopId: shop.id,
                shopStaffId: appointment.staffId,
                rating: input.rating,
                comment: input.comment,
                imageUrls: input.imageUrls ?? [],
            },
            select: staffReviewSelect,
        });
        await refreshStaffRating(tx, appointment.staffId);
        return review;
    });
};
exports.createStaffReview = createStaffReview;
const createServiceReview = async (shopSlug, actorUserId, input) => {
    if (!actorUserId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const shop = await getShop(shopSlug);
    const appointmentService = await prisma_1.db.appointmentService.findUnique({
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
        throw new ApiError_1.ApiError(404, "Appointment service not found");
    }
    if (appointmentService.service.shopId !== shop.id) {
        throw new ApiError_1.ApiError(409, "The service does not belong to this shop");
    }
    if (appointmentService.appointment.customerId !== actorUserId) {
        throw new ApiError_1.ApiError(403, "Only the appointment customer can create this review");
    }
    assertCompletedAppointment(appointmentService.appointment.status);
    const existing = await prisma_1.db.serviceReview.findUnique({
        where: { appointmentServiceId: appointmentService.id },
    });
    if (existing)
        throw new ApiError_1.ApiError(409, "A service review already exists for this appointment service");
    return prisma_1.db.$transaction(async (tx) => {
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
exports.createServiceReview = createServiceReview;
const listShopReviews = async (shopSlug, query) => {
    const shop = await getShop(shopSlug);
    const { page, limit } = getPagination(query);
    const where = { shopId: shop.id, isPublic: true };
    const [total, items] = await Promise.all([
        prisma_1.db.shopReview.count({ where }),
        prisma_1.db.shopReview.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: reviewSelect,
        }),
    ]);
    return { items, meta: paginationMeta(total, page, limit) };
};
exports.listShopReviews = listShopReviews;
const listStaffReviews = async (shopSlug, staffId, query) => {
    const shop = await getShop(shopSlug);
    const staff = await prisma_1.db.shopStaff.findFirst({ where: { id: staffId, shopId: shop.id }, select: { id: true } });
    if (!staff)
        throw new ApiError_1.ApiError(404, "Staff member not found");
    const { page, limit } = getPagination(query);
    const where = { shopId: shop.id, shopStaffId: staff.id, isPublic: true };
    const [total, items] = await Promise.all([
        prisma_1.db.staffReview.count({ where }),
        prisma_1.db.staffReview.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: staffReviewSelect,
        }),
    ]);
    return { items, meta: paginationMeta(total, page, limit) };
};
exports.listStaffReviews = listStaffReviews;
const listServiceReviews = async (shopSlug, serviceId, query) => {
    const shop = await getShop(shopSlug);
    const service = await prisma_1.db.service.findFirst({ where: { id: serviceId, shopId: shop.id }, select: { id: true } });
    if (!service)
        throw new ApiError_1.ApiError(404, "Service not found");
    const { page, limit } = getPagination(query);
    const where = { shopId: shop.id, serviceId: service.id, isPublic: true };
    const [total, items] = await Promise.all([
        prisma_1.db.serviceReview.count({ where }),
        prisma_1.db.serviceReview.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: serviceReviewSelect,
        }),
    ]);
    return { items, meta: paginationMeta(total, page, limit) };
};
exports.listServiceReviews = listServiceReviews;
const getShopReview = async (shopSlug, reviewId) => {
    const shop = await getShop(shopSlug);
    const review = await prisma_1.db.shopReview.findFirst({ where: { id: reviewId, shopId: shop.id }, select: reviewSelect });
    if (!review)
        throw new ApiError_1.ApiError(404, "Shop review not found");
    return review;
};
exports.getShopReview = getShopReview;
const getStaffReview = async (shopSlug, staffId, reviewId) => {
    const shop = await getShop(shopSlug);
    const review = await prisma_1.db.staffReview.findFirst({ where: { id: reviewId, shopId: shop.id, shopStaffId: staffId }, select: staffReviewSelect });
    if (!review)
        throw new ApiError_1.ApiError(404, "Staff review not found");
    return review;
};
exports.getStaffReview = getStaffReview;
const getServiceReview = async (shopSlug, serviceId, reviewId) => {
    const shop = await getShop(shopSlug);
    const review = await prisma_1.db.serviceReview.findFirst({ where: { id: reviewId, shopId: shop.id, serviceId }, select: serviceReviewSelect });
    if (!review)
        throw new ApiError_1.ApiError(404, "Service review not found");
    return review;
};
exports.getServiceReview = getServiceReview;
const updateShopReview = async (shopSlug, reviewId, actorUserId, input) => {
    const shop = await getShop(shopSlug);
    const existing = await prisma_1.db.shopReview.findFirst({ where: { id: reviewId, shopId: shop.id } });
    if (!existing)
        throw new ApiError_1.ApiError(404, "Shop review not found");
    assertReviewOwner(existing.customerId, actorUserId);
    return prisma_1.db.$transaction(async (tx) => {
        const review = await tx.shopReview.update({ where: { id: reviewId }, data: input, select: reviewSelect });
        await refreshShopRating(tx, shop.id);
        return review;
    });
};
exports.updateShopReview = updateShopReview;
const updateStaffReview = async (shopSlug, staffId, reviewId, actorUserId, input) => {
    const shop = await getShop(shopSlug);
    const existing = await prisma_1.db.staffReview.findFirst({ where: { id: reviewId, shopId: shop.id, shopStaffId: staffId } });
    if (!existing)
        throw new ApiError_1.ApiError(404, "Staff review not found");
    assertReviewOwner(existing.customerId, actorUserId);
    return prisma_1.db.$transaction(async (tx) => {
        const review = await tx.staffReview.update({ where: { id: reviewId }, data: input, select: staffReviewSelect });
        await refreshStaffRating(tx, staffId);
        return review;
    });
};
exports.updateStaffReview = updateStaffReview;
const updateServiceReview = async (shopSlug, serviceId, reviewId, actorUserId, input) => {
    const shop = await getShop(shopSlug);
    const existing = await prisma_1.db.serviceReview.findFirst({ where: { id: reviewId, shopId: shop.id, serviceId } });
    if (!existing)
        throw new ApiError_1.ApiError(404, "Service review not found");
    assertReviewOwner(existing.customerId, actorUserId);
    return prisma_1.db.$transaction(async (tx) => {
        const review = await tx.serviceReview.update({ where: { id: reviewId }, data: input, select: serviceReviewSelect });
        await refreshServiceRating(tx, serviceId);
        return review;
    });
};
exports.updateServiceReview = updateServiceReview;
const deleteShopReview = async (shopSlug, reviewId, actorUserId) => {
    const shop = await getShop(shopSlug);
    const existing = await prisma_1.db.shopReview.findFirst({ where: { id: reviewId, shopId: shop.id } });
    if (!existing)
        throw new ApiError_1.ApiError(404, "Shop review not found");
    assertReviewOwner(existing.customerId, actorUserId);
    await prisma_1.db.$transaction(async (tx) => {
        await tx.shopReview.delete({ where: { id: reviewId } });
        await refreshShopRating(tx, shop.id);
    });
};
exports.deleteShopReview = deleteShopReview;
const deleteStaffReview = async (shopSlug, staffId, reviewId, actorUserId) => {
    const shop = await getShop(shopSlug);
    const existing = await prisma_1.db.staffReview.findFirst({ where: { id: reviewId, shopId: shop.id, shopStaffId: staffId } });
    if (!existing)
        throw new ApiError_1.ApiError(404, "Staff review not found");
    assertReviewOwner(existing.customerId, actorUserId);
    await prisma_1.db.$transaction(async (tx) => {
        await tx.staffReview.delete({ where: { id: reviewId } });
        await refreshStaffRating(tx, staffId);
    });
};
exports.deleteStaffReview = deleteStaffReview;
const deleteServiceReview = async (shopSlug, serviceId, reviewId, actorUserId) => {
    const shop = await getShop(shopSlug);
    const existing = await prisma_1.db.serviceReview.findFirst({ where: { id: reviewId, shopId: shop.id, serviceId } });
    if (!existing)
        throw new ApiError_1.ApiError(404, "Service review not found");
    assertReviewOwner(existing.customerId, actorUserId);
    await prisma_1.db.$transaction(async (tx) => {
        await tx.serviceReview.delete({ where: { id: reviewId } });
        await refreshServiceRating(tx, serviceId);
    });
};
exports.deleteServiceReview = deleteServiceReview;
