"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAppointmentsAsDone = exports.getIncomeByDayWeekly = exports.changeAppointmentStatus = exports.getAppointmentsByDay = exports.getAppointmentsByShopId = exports.createAppointment = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const calendar_service_1 = require("@/service/calendar/calendar.service");
const slot_helper_1 = require("@/helper/slot.helper");
const price_helper_1 = require("@/helper/price.helper");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const socket_1 = require("@/socket");
const createAppointment = async (data, customerId, shopSlug) => {
    if (!customerId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { staffId, date, startTime, serviceIds, serviceOptions, packageIds, addonIds, note, source, promotionId, } = data;
    // Get shop first
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
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
    // Get userId from ShopStaff if staffId provided (because Appointment.staffId references User.id)
    // let assignedUserId: string | null = null;
    // if (staffId) {
    //   const shopStaff = await db.shopStaff.findFirst({
    //     where: { id: staffId, shopId: shop.id, isActive: true },
    //   });
    //   if (!shopStaff) {
    //     throw new ApiError(404, "Staff not found");
    //   }
    //   assignedUserId = shopStaff.userId;
    // }
    const subtotal = services.reduce((sum, s) => sum + (s.basePrice ?? 0), 0) +
        optionValues.reduce((sum, ov) => sum + ov.price, 0) +
        packages.reduce((sum, p) => sum + p.basePrice, 0) +
        addons.reduce((sum, a) => sum + a.price, 0);
    let totalAmount = subtotal;
    let discountAmount = 0;
    if (promotionId) {
        [totalAmount, discountAmount] = await (0, price_helper_1.priceDiscountCalculate)(subtotal, 0, promotionId);
    }
    const appointment = await prisma_1.db.appointment.create({
        data: {
            shopId: shop.id,
            customerId,
            staffId: staffId,
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
const getAppointmentsByDay = async (shopSlug, date, staffUserId) => {
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
            ...(staffUserId ? { staffId: staffUserId } : {}),
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
    console.log(data);
    return data;
};
exports.getAppointmentsByDay = getAppointmentsByDay;
const changeAppointmentStatus = async (shopSlug, appointmentId, status) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    return await prisma_1.db.appointment.update({
        where: {
            id: appointmentId,
        },
        data: {
            status: status,
        },
    });
};
exports.changeAppointmentStatus = changeAppointmentStatus;
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
            status: "DONE",
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
const markAllAppointmentsAsDone = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const result = await prisma_1.db.appointment.updateMany({
        where: { shopId: shop.id },
        data: { status: "DONE" },
    });
    return result;
};
exports.markAllAppointmentsAsDone = markAllAppointmentsAsDone;
