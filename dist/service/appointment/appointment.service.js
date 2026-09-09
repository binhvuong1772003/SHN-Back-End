"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAppointmentsAsDone = exports.getIncomeByDayWeekly = exports.getAppointmentLifecycle = exports.changeAppointmentStatus = exports.updateAppointment = exports.getAppointmentsByDayForUser = exports.getAppointmentsByDay = exports.getAppointmentsByShopId = exports.createAppointment = void 0;
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
const calendar_service_1 = require("../../service/calendar/calendar.service");
const slot_helper_1 = require("../../helper/slot.helper");
const price_helper_1 = require("../../helper/price.helper");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const socket_1 = require("../../socket");
const appointmentTransitions = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
    IN_PROGRESS: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
};
const assertManagerCanChangeStatus = (role) => {
    if (role !== "OWNER" && role !== "MANAGER") {
        throw new ApiError_1.ApiError(403, "Only shop managers can change appointment status");
    }
};
const isAppointmentStatus = (status) => [
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
].includes(status);
const createAppointment = async (data, customerId, shopSlug, actorUserId) => {
    if (!customerId || !actorUserId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { staffId, date, startTime, serviceIds, serviceOptions, packageIds, addonIds, note, source, promotionId, } = data;
    // Get shop first
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const bookingForAnotherCustomer = actorUserId !== customerId;
    if (bookingForAnotherCustomer) {
        const actorStaff = await prisma_1.db.shopStaff.findFirst({
            where: { shopId: shop.id, userId: actorUserId, isActive: true },
            select: { role: true },
        });
        if (!actorStaff || !["MANAGER", "OWNER"].includes(actorStaff.role)) {
            throw new ApiError_1.ApiError(403, "Only managers can create appointments for another customer");
        }
        const shopCustomer = await prisma_1.db.shopCustomer.findUnique({
            where: {
                shopId_customerId: {
                    shopId: shop.id,
                    customerId,
                },
            },
            select: { totalVisits: true, isBlocked: true },
        });
        if (!shopCustomer ||
            shopCustomer.isBlocked ||
            shopCustomer.totalVisits <= 0) {
            throw new ApiError_1.ApiError(403, "This customer has not used a service at this shop");
        }
    }
    const customer = await prisma_1.db.user.findFirst({
        where: {
            id: customerId,
            role: "CUSTOMER",
            isActive: true,
        },
        select: { id: true },
    });
    if (!customer) {
        throw new ApiError_1.ApiError(404, "Customer not found or inactive");
    }
    // Fetch services with their options
    const services = serviceIds?.length
        ? await prisma_1.db.service.findMany({
            where: { id: { in: serviceIds }, shopId: shop.id, isActive: true },
            include: {
                options: {
                    where: { isRequired: true },
                },
            },
        })
        : [];
    const packages = packageIds?.length
        ? await prisma_1.db.servicePackage.findMany({
            where: { id: { in: packageIds }, shopId: shop.id, isActive: true },
            include: {
                items: {
                    where: { isIncluded: true },
                    select: { serviceId: true },
                },
            },
        })
        : [];
    const addons = addonIds?.length
        ? await prisma_1.db.addonService.findMany({
            where: { id: { in: addonIds }, shopId: shop.id, isActive: true },
        })
        : [];
    const allOptionValueIds = serviceOptions?.flatMap((so) => so.optionValueIds) ?? [];
    const optionValues = allOptionValueIds.length
        ? await prisma_1.db.optionValue.findMany({
            where: { id: { in: allOptionValueIds }, isActive: true },
        })
        : [];
    if (serviceIds?.length && services.length !== serviceIds.length) {
        throw new ApiError_1.ApiError(404, "One or more services were not found or are unavailable");
    }
    if (packageIds?.length && packages.length !== packageIds.length) {
        throw new ApiError_1.ApiError(404, "One or more service packages were not found or are unavailable");
    }
    if (addonIds?.length && addons.length !== addonIds.length) {
        throw new ApiError_1.ApiError(404, "One or more add-ons were not found or are unavailable");
    }
    let assignedStaffId;
    if (staffId) {
        const shopStaff = await prisma_1.db.shopStaff.findFirst({
            where: { id: staffId, shopId: shop.id, isActive: true },
            select: { id: true, userId: true },
        });
        if (!shopStaff) {
            throw new ApiError_1.ApiError(404, "Staff not found in this shop");
        }
        const requestedServiceIds = [
            ...new Set([
                ...services.map((service) => service.id),
                ...packages.flatMap((servicePackage) => servicePackage.items.map((item) => item.serviceId)),
            ]),
        ];
        if (requestedServiceIds.length > 0) {
            const assignedServices = await prisma_1.db.staffService.findMany({
                where: {
                    shopStaffId: shopStaff.id,
                    serviceId: { in: requestedServiceIds },
                    isActive: true,
                    service: {
                        shopId: shop.id,
                        isActive: true,
                    },
                },
                select: { serviceId: true },
            });
            const assignedServiceIds = new Set(assignedServices.map((service) => service.serviceId));
            const unsupportedServiceIds = requestedServiceIds.filter((serviceId) => !assignedServiceIds.has(serviceId));
            if (unsupportedServiceIds.length > 0) {
                throw new ApiError_1.ApiError(400, "The selected staff member cannot perform one or more selected services");
            }
        }
        assignedStaffId = shopStaff.id;
    }
    if (services.length === 0 && packages.length === 0) {
        throw new ApiError_1.ApiError(400, "At least one service or package is required");
    }
    // Validate required options are selected
    for (const service of services) {
        if (service.options && service.options.length > 0) {
            const serviceOptionData = serviceOptions?.find((so) => so.serviceId === service.id);
            if (!serviceOptionData || serviceOptionData.optionValueIds.length === 0) {
                throw new ApiError_1.ApiError(400, `Service "${service.name}" requires an option selection`);
            }
        }
    }
    // Calculate total duration: service base + option values + addons
    let totalDuration = 0;
    // Add base service durations
    totalDuration += services.reduce((sum, s) => sum + s.durationMin, 0);
    // Add option values durations
    totalDuration += optionValues.reduce((sum, ov) => sum + (ov.duration ?? 0), 0);
    // Add addon durations
    totalDuration += addons.reduce((sum, a) => sum + (a.duration ?? 0), 0);
    if (totalDuration < 15) {
        throw new ApiError_1.ApiError(400, "Service duration must be at least 15 minutes");
    }
    // Calculate endTime and validate slot
    const endTime = (0, slot_helper_1.addMinutesToTime)(startTime, totalDuration);
    const appointmentDate = dayjs_1.default.tz(date, shop.timezone).startOf("day").toDate();
    // Validate booking slot (date, time, staff, conflicts)
    const validationResult = await (0, calendar_service_1.validateBookingSlot)({
        shopSlug,
        date,
        startTime,
        durationMin: totalDuration,
        staffId,
    });
    // Appointment.staffId stores ShopStaff.id.
    const subtotal = services.reduce((sum, s) => sum + (s.basePrice ?? 0), 0) +
        optionValues.reduce((sum, ov) => sum + ov.price, 0) +
        packages.reduce((sum, p) => sum + p.basePrice, 0) +
        addons.reduce((sum, a) => sum + a.price, 0);
    let totalAmount = subtotal;
    let discountAmount = 0;
    if (promotionId) {
        [totalAmount, discountAmount] = await (0, price_helper_1.priceDiscountCalculate)(subtotal, 0, promotionId);
    }
    const appointment = await prisma_1.db.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
            data: {
                shopId: shop.id,
                customerId,
                staffId: assignedStaffId,
                date: appointmentDate,
                startTime,
                endTime,
                status: shop.settings?.autoConfirm ? "CONFIRMED" : "PENDING",
                source: source ?? "APP",
                note: note ?? null,
                promotionId: promotionId ?? null,
                subtotal,
                discountAmount,
                totalAmount,
                services: {
                    create: services.map((s) => {
                        const serviceOptionData = serviceOptions?.find((so) => so.serviceId === s.id);
                        const selectedOptionValues = serviceOptionData
                            ? optionValues.filter((ov) => serviceOptionData.optionValueIds.includes(ov.id))
                            : [];
                        return {
                            serviceId: s.id,
                            serviceName: s.name,
                            priceAtBooking: s.basePrice ?? 0,
                            durationMin: s.durationMin,
                            selectedValues: {
                                create: selectedOptionValues.map((ov) => ({
                                    optionValueId: ov.id,
                                    priceAtBooking: ov.price,
                                })),
                            },
                        };
                    }),
                },
                packages: {
                    create: packages.map((p) => ({
                        packageId: p.id,
                        priceAtBooking: p.basePrice,
                    })),
                },
                addons: {
                    create: addons.map((a) => ({
                        addonId: a.id,
                        priceAtBooking: a.price,
                    })),
                },
            },
            include: {
                services: {
                    include: {
                        selectedValues: true,
                    },
                },
                packages: true,
                addons: {
                    include: {
                        addon: true,
                    },
                },
                customer: true,
            },
        });
        const bookingAt = new Date();
        await tx.shopCustomer.upsert({
            where: {
                shopId_customerId: {
                    shopId: shop.id,
                    customerId,
                },
            },
            create: {
                shopId: shop.id,
                customerId,
                firstBookingAt: bookingAt,
                lastBookingAt: bookingAt,
                totalBookings: 1,
            },
            update: {
                lastBookingAt: bookingAt,
                totalBookings: { increment: 1 },
            },
        });
        return appointment;
    });
    await prisma_1.db.appointmentLifecycle.create({
        data: {
            appointmentId: appointment.id,
            shopId: shop.id,
            toStatus: appointment.status,
            changedById: customerId,
            reason: "Appointment created",
            metadata: {
                source: source ?? "APP",
                autoConfirmed: Boolean(shop.settings?.autoConfirm),
            },
        },
    });
    await prisma_1.db.auditLog.create({
        data: {
            shopId: shop.id,
            userId: customerId,
            action: "APPOINTMENT_CREATED",
            entity: "Appointment",
            entityId: appointment.id,
            changes: { toStatus: appointment.status },
        },
    });
    if (promotionId) {
        await (0, price_helper_1.incrementPromotionUsage)(promotionId);
    }
    const managers = await prisma_1.db.shopStaff.findMany({
        where: { shopId: shop.id, OR: [{ role: "MANAGER" }, { role: "OWNER" }] },
    });
    console.log(managers);
    console.log("🔌 Connected sockets:", (0, socket_1.getIO)().sockets.adapter.rooms);
    const notifications = await Promise.all(managers.map((m) => prisma_1.db.notification.create({
        data: {
            title: "New appointment request",
            content: `${appointment?.customer.name} booked an appointment from ${appointment.startTime} to ${appointment.endTime} on ${appointmentDate}`,
            type: "OFF_DAY_REQUEST",
            channel: "PUSH",
            shopId: shop.id,
            userId: m.userId,
        },
    })));
    (0, socket_1.getIO)()
        .to(`shop:${shop.id}`)
        .emit("appointment_request", {
        appointmentId: appointment.id,
        message: `${appointment?.customer.name} booked an appointment from ${appointment.startTime} to ${appointment.endTime} on ${appointmentDate}`,
        notificationId: notifications[0].id,
    });
    return appointment;
};
exports.createAppointment = createAppointment;
const getAppointmentsByShopId = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    return await prisma_1.db.appointment.findMany({
        where: {
            shopId: shop.id,
        },
        include: {
            services: {
                include: {
                    selectedValues: true,
                },
            },
            packages: true,
            addons: {
                include: {
                    addon: true,
                },
            },
        },
    });
};
exports.getAppointmentsByShopId = getAppointmentsByShopId;
const getAppointmentsByDay = async (shopSlug, date, staffId) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const appointmentDate = dayjs_1.default.tz(date, shop.timezone).startOf("day").toDate();
    const data = await prisma_1.db.appointment.findMany({
        where: {
            shopId: shop.id,
            date: appointmentDate,
            ...(staffId ? { staffId } : {}),
        },
        include: {
            services: {
                include: {
                    selectedValues: true,
                },
            },
            packages: true,
            addons: {
                include: {
                    addon: true,
                },
            },
            customer: true,
        },
    });
    return data;
};
exports.getAppointmentsByDay = getAppointmentsByDay;
const getAppointmentsByDayForUser = async (shopSlug, date, userId) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
        select: { id: true },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { shopId: shop.id, userId, isActive: true },
        select: { id: true },
    });
    if (!staff)
        return [];
    return (0, exports.getAppointmentsByDay)(shopSlug, date, staff.id);
};
exports.getAppointmentsByDayForUser = getAppointmentsByDayForUser;
const updateAppointment = async (shopSlug, appointmentId, patch, actorUserId, actorRole) => {
    assertManagerCanChangeStatus(actorRole);
    if (!actorUserId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const current = await prisma_1.db.appointment.findFirst({
        where: { id: appointmentId, shopId: shop.id },
        include: {
            services: { select: { serviceId: true, durationMin: true } },
            packages: {
                select: {
                    package: {
                        select: {
                            items: {
                                where: { isIncluded: true },
                                select: { serviceId: true },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!current)
        throw new ApiError_1.ApiError(404, "Appointment not found");
    if (!["PENDING", "CONFIRMED"].includes(current.status)) {
        throw new ApiError_1.ApiError(409, "Only pending or confirmed appointments can be updated");
    }
    const currentDate = (0, dayjs_1.default)(current.date)
        .tz(shop.timezone)
        .format("YYYY-MM-DD");
    const nextDate = patch.date ?? currentDate;
    const nextStartTime = patch.startTime ?? current.startTime;
    const durationMin = (0, slot_helper_1.timeToMinutes)(current.endTime) - (0, slot_helper_1.timeToMinutes)(current.startTime);
    if (durationMin < 15) {
        throw new ApiError_1.ApiError(400, "Appointment duration must be at least 15 minutes");
    }
    const currentStaff = current.staffId
        ? await prisma_1.db.shopStaff.findFirst({
            where: { id: current.staffId, shopId: shop.id, isActive: true },
            select: { id: true },
        })
        : null;
    if (current.staffId && !currentStaff) {
        throw new ApiError_1.ApiError(404, "Assigned staff not found in this shop");
    }
    let nextStaffId = current.staffId;
    let nextShopStaffId = currentStaff?.id;
    if (patch.staffId !== undefined) {
        if (patch.staffId === null) {
            nextStaffId = null;
            nextShopStaffId = undefined;
        }
        else {
            const nextStaff = await prisma_1.db.shopStaff.findFirst({
                where: { id: patch.staffId, shopId: shop.id, isActive: true },
                select: { id: true, userId: true },
            });
            if (!nextStaff)
                throw new ApiError_1.ApiError(404, "Staff not found in this shop");
            nextStaffId = nextStaff.id;
            nextShopStaffId = nextStaff.id;
        }
    }
    const requestedServiceIds = [
        ...new Set([
            ...current.services.map((service) => service.serviceId),
            ...current.packages.flatMap((item) => item.package.items.map((service) => service.serviceId)),
        ]),
    ];
    if (nextShopStaffId && requestedServiceIds.length > 0) {
        const assignedServices = await prisma_1.db.staffService.findMany({
            where: {
                shopStaffId: nextShopStaffId,
                serviceId: { in: requestedServiceIds },
                isActive: true,
                service: { shopId: shop.id, isActive: true },
            },
            select: { serviceId: true },
        });
        if (new Set(assignedServices.map((service) => service.serviceId)).size !==
            requestedServiceIds.length) {
            throw new ApiError_1.ApiError(400, "The selected staff member cannot perform one or more appointment services");
        }
    }
    if (patch.date !== undefined ||
        patch.startTime !== undefined ||
        patch.staffId !== undefined) {
        await (0, calendar_service_1.validateBookingSlot)({
            shopSlug,
            date: nextDate,
            startTime: nextStartTime,
            durationMin,
            staffId: nextShopStaffId,
        });
    }
    const nextEndTime = (0, slot_helper_1.addMinutesToTime)(nextStartTime, durationMin);
    const nextAppointmentDate = dayjs_1.default
        .tz(nextDate, shop.timezone)
        .startOf("day")
        .toDate();
    const patchMetadata = JSON.parse(JSON.stringify(patch));
    return prisma_1.db.$transaction(async (tx) => {
        const updateResult = await tx.appointment.updateMany({
            where: { id: current.id, shopId: shop.id, status: current.status },
            data: {
                date: nextAppointmentDate,
                startTime: nextStartTime,
                endTime: nextEndTime,
                staffId: nextStaffId,
                ...(patch.note !== undefined ? { note: patch.note } : {}),
                ...(patch.internalNote !== undefined
                    ? { internalNote: patch.internalNote }
                    : {}),
            },
        });
        if (updateResult.count !== 1) {
            throw new ApiError_1.ApiError(409, "Appointment was changed by another request");
        }
        const updated = await tx.appointment.findUnique({
            where: { id: current.id },
        });
        if (!updated)
            throw new ApiError_1.ApiError(404, "Appointment not found");
        await tx.appointmentLifecycle.create({
            data: {
                appointmentId: updated.id,
                shopId: shop.id,
                fromStatus: current.status,
                toStatus: current.status,
                changedById: actorUserId,
                reason: "Appointment details updated",
                metadata: patchMetadata,
            },
        });
        await tx.auditLog.create({
            data: {
                shopId: shop.id,
                userId: actorUserId,
                action: "APPOINTMENT_UPDATED",
                entity: "Appointment",
                entityId: updated.id,
                changes: patchMetadata,
            },
        });
        return updated;
    });
};
exports.updateAppointment = updateAppointment;
const changeAppointmentStatus = async (shopSlug, appointmentId, status, actorUserId, actorRole, reason, cancelReason, internalNote) => {
    assertManagerCanChangeStatus(actorRole);
    if (!actorUserId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    if (!isAppointmentStatus(status) || status === "PENDING") {
        throw new ApiError_1.ApiError(400, "Invalid appointment transition status");
    }
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    return await prisma_1.db.$transaction(async (tx) => {
        const current = await tx.appointment.findFirst({
            where: { id: appointmentId, shopId: shop.id },
            select: { id: true, shopId: true, status: true, cancelReason: true },
        });
        if (!current)
            throw new ApiError_1.ApiError(404, "Appointment not found");
        const nextStatus = status;
        if (!appointmentTransitions[current.status].includes(nextStatus)) {
            throw new ApiError_1.ApiError(409, `Cannot change appointment status from ${current.status} to ${nextStatus}`);
        }
        if (nextStatus === "CANCELLED" && !(cancelReason || reason)) {
            throw new ApiError_1.ApiError(400, "Cancellation reason is required");
        }
        const now = new Date();
        const updateResult = await tx.appointment.updateMany({
            where: { id: current.id, shopId: current.shopId, status: current.status },
            data: {
                status: nextStatus,
                ...(nextStatus === "IN_PROGRESS" ? { checkedInAt: now } : {}),
                ...(nextStatus === "COMPLETED" ? { completedAt: now } : {}),
                ...(nextStatus === "CANCELLED"
                    ? { cancelReason: cancelReason || reason }
                    : {}),
                ...(internalNote !== undefined ? { internalNote } : {}),
            },
        });
        if (updateResult.count !== 1) {
            throw new ApiError_1.ApiError(409, "Appointment status was changed by another request");
        }
        const updated = await tx.appointment.findUnique({
            where: { id: current.id },
        });
        if (!updated)
            throw new ApiError_1.ApiError(404, "Appointment not found");
        if (nextStatus === "COMPLETED") {
            const shopCustomer = await tx.shopCustomer.findUnique({
                where: {
                    shopId_customerId: {
                        shopId: updated.shopId,
                        customerId: updated.customerId,
                    },
                },
                select: { id: true, firstVisitAt: true },
            });
            if (shopCustomer) {
                await tx.shopCustomer.update({
                    where: { id: shopCustomer.id },
                    data: {
                        ...(shopCustomer.firstVisitAt ? {} : { firstVisitAt: now }),
                        lastVisitAt: now,
                        totalVisits: { increment: 1 },
                        totalSpent: { increment: updated.totalAmount },
                    },
                });
            }
            else {
                await tx.shopCustomer.create({
                    data: {
                        shopId: updated.shopId,
                        customerId: updated.customerId,
                        firstBookingAt: updated.createdAt,
                        lastBookingAt: updated.createdAt,
                        firstVisitAt: now,
                        lastVisitAt: now,
                        totalBookings: 1,
                        totalVisits: 1,
                        totalSpent: updated.totalAmount,
                    },
                });
            }
        }
        await tx.appointmentLifecycle.create({
            data: {
                appointmentId: current.id,
                shopId: current.shopId,
                fromStatus: current.status,
                toStatus: nextStatus,
                reason: reason || cancelReason || null,
                changedById: actorUserId,
            },
        });
        await tx.auditLog.create({
            data: {
                shopId: current.shopId,
                userId: actorUserId,
                action: "APPOINTMENT_STATUS_CHANGED",
                entity: "Appointment",
                entityId: current.id,
                changes: {
                    fromStatus: current.status,
                    toStatus: nextStatus,
                    reason: reason || cancelReason || null,
                },
            },
        });
        return updated;
    });
};
exports.changeAppointmentStatus = changeAppointmentStatus;
const getAppointmentLifecycle = async (shopSlug, appointmentId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const appointment = await prisma_1.db.appointment.findFirst({
        where: { id: appointmentId, shopId: shop.id },
        select: { id: true },
    });
    if (!appointment)
        throw new ApiError_1.ApiError(404, "Appointment not found");
    return prisma_1.db.appointmentLifecycle.findMany({
        where: { appointmentId: appointment.id, shopId: shop.id },
        orderBy: { createdAt: "asc" },
        include: {
            changedBy: { select: { id: true, name: true } },
        },
    });
};
exports.getAppointmentLifecycle = getAppointmentLifecycle;
const getIncomeByDayWeekly = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const now = dayjs_1.default.tz(new Date(), shop.timezone);
    const day = now.day();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = now.add(diffToMonday, "day").startOf("day").toDate();
    const end = dayjs_1.default.tz(start, shop.timezone).add(7, "day").toDate();
    const appointments = await prisma_1.db.appointment.findMany({
        where: {
            shopId: shop.id,
            status: "COMPLETED",
            date: {
                gte: start,
                lt: end,
            },
        },
        select: {
            date: true,
            totalAmount: true,
        },
    });
    const incomeByDate = {};
    for (const { date, totalAmount } of appointments) {
        const key = (0, dayjs_1.default)(date).tz(shop.timezone).format("YYYY-MM-DD");
        incomeByDate[key] = (incomeByDate[key] ?? 0) + (totalAmount ?? 0);
    }
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = dayjs_1.default.tz(start, shop.timezone).add(i, "day");
        return {
            day: d.format("ddd"),
            date: d.format("DD"),
            income: incomeByDate[d.format("YYYY-MM-DD")] ?? 0,
        };
    });
    const weekRange = `${days[0].day} ${days[0].date} - ${days[6].day} ${days[6].date}`;
    const today = {
        fullDate: dayjs_1.default.tz(new Date(), shop.timezone).format("YYYY/MM/DD"),
        income: incomeByDate[dayjs_1.default.tz(new Date(), shop.timezone).format("YYYY-MM-DD")] ??
            0,
    };
    const weeklyTotal = days.reduce((sum, item) => sum + item.income, 0);
    return { weekRange, days, today, weeklyTotal };
};
exports.getIncomeByDayWeekly = getIncomeByDayWeekly;
const markAllAppointmentsAsDone = async (shopSlug, actorUserId, actorRole) => {
    assertManagerCanChangeStatus(actorRole);
    if (!actorUserId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const appointments = await prisma_1.db.appointment.findMany({
        where: {
            shopId: shop.id,
            status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        },
        select: { id: true, status: true },
    });
    for (const appointment of appointments) {
        await (0, exports.changeAppointmentStatus)(shopSlug, appointment.id, "COMPLETED", actorUserId, actorRole, "Bulk completion by manager");
    }
    return { count: appointments.length };
};
exports.markAllAppointmentsAsDone = markAllAppointmentsAsDone;
