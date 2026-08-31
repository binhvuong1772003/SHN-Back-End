"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPayrollDetailService = exports.getMyPayrollsService = exports.payPayrollService = exports.confirmPayrollService = exports.adjustDraftPayrollService = exports.getPayrollDetailService = exports.getPayrollListService = exports.generateDraftPayrollsService = exports.upsertServiceCommissionService = exports.getServiceCommissionsService = exports.upsertSalaryConfigService = exports.getSalaryConfigService = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const toAuditJson = (value) => JSON.parse(JSON.stringify(value));
const getShop = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    return shop;
};
const getStaff = async (shopId, staffId) => {
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { id: staffId, shopId },
        include: { user: { select: { name: true, email: true } } },
    });
    if (!staff)
        throw new ApiError_1.ApiError(404, "Staff member not found in this shop");
    return staff;
};
const writeAudit = async (input, client = prisma_1.db) => {
    await client.auditLog.create({
        data: {
            shopId: input.shopId,
            userId: input.userId,
            action: input.action,
            entity: input.entity,
            entityId: input.entityId,
            changes: input.changes === undefined ? undefined : toAuditJson(input.changes),
            ipAddress: input.ipAddress,
        },
    });
};
const getSalaryConfigService = async (shopSlug, staffId) => {
    const shop = await getShop(shopSlug);
    await getStaff(shop.id, staffId);
    return prisma_1.db.staffSalaryConfig.findUnique({
        where: { shopStaffId: staffId },
    });
};
exports.getSalaryConfigService = getSalaryConfigService;
const upsertSalaryConfigService = async (shopSlug, staffId, input, actorUserId, ipAddress) => {
    const shop = await getShop(shopSlug);
    await getStaff(shop.id, staffId);
    return prisma_1.db.$transaction(async (tx) => {
        const config = await tx.staffSalaryConfig.upsert({
            where: { shopStaffId: staffId },
            create: { shopId: shop.id, shopStaffId: staffId, ...input },
            update: input,
        });
        await writeAudit({
            shopId: shop.id,
            userId: actorUserId,
            action: "SALARY_CONFIG_UPDATED",
            entity: "StaffSalaryConfig",
            entityId: config.id,
            changes: input,
            ipAddress,
        }, tx);
        return config;
    });
};
exports.upsertSalaryConfigService = upsertSalaryConfigService;
const getServiceCommissionsService = async (shopSlug, staffId) => {
    const shop = await getShop(shopSlug);
    await getStaff(shop.id, staffId);
    return prisma_1.db.serviceCommission.findMany({
        where: { shopStaffId: staffId },
        include: { service: true },
    });
};
exports.getServiceCommissionsService = getServiceCommissionsService;
const upsertServiceCommissionService = async (shopSlug, staffId, serviceId, input, actorUserId, ipAddress) => {
    const shop = await getShop(shopSlug);
    await getStaff(shop.id, staffId);
    const service = await prisma_1.db.service.findFirst({
        where: { id: serviceId, shopId: shop.id },
    });
    if (!service)
        throw new ApiError_1.ApiError(404, "Service not found in this shop");
    return prisma_1.db.$transaction(async (tx) => {
        const commission = await tx.serviceCommission.upsert({
            where: {
                shopStaffId_serviceId: { shopStaffId: staffId, serviceId },
            },
            create: { shopStaffId: staffId, serviceId, ...input },
            update: input,
        });
        await writeAudit({
            shopId: shop.id,
            userId: actorUserId,
            action: "SERVICE_COMMISSION_UPDATED",
            entity: "ServiceCommission",
            entityId: commission.id,
            changes: input,
            ipAddress,
        }, tx);
        return commission;
    });
};
exports.upsertServiceCommissionService = upsertServiceCommissionService;
const calculateDraftForStaff = async (shop, staff, periodStart, periodEnd, queryEnd) => {
    const config = staff.salaryConfig;
    const [attendances, appointments, commissions, positiveReviews, noShows, schedules] = await Promise.all([
        prisma_1.db.attendance.findMany({
            where: {
                shopStaffId: staff.id,
                date: { gte: periodStart, lte: queryEnd },
            },
        }),
        prisma_1.db.appointment.findMany({
            where: {
                shopId: shop.id,
                staffId: staff.userId,
                date: { gte: periodStart, lte: queryEnd },
                status: "COMPLETED",
                payment: { is: { status: "PAID" } },
            },
            include: { services: true },
        }),
        prisma_1.db.serviceCommission.findMany({ where: { shopStaffId: staff.id } }),
        prisma_1.db.review.count({
            where: {
                shopId: shop.id,
                staffId: staff.userId,
                rating: { gte: 4 },
                createdAt: { gte: periodStart, lte: queryEnd },
            },
        }),
        prisma_1.db.appointment.count({
            where: {
                shopId: shop.id,
                staffId: staff.userId,
                status: "NO_SHOW",
                date: { gte: periodStart, lte: queryEnd },
            },
        }),
        prisma_1.db.staffSchedule.findMany({ where: { shopStaffId: staff.id } }),
    ]);
    const totalWorkMinutes = attendances.reduce((sum, item) => sum + item.workMinutes, 0);
    const totalWorkDays = attendances.filter((item) => item.checkIn).length;
    const totalLateMinutes = attendances.reduce((sum, item) => sum + item.lateMinutes, 0);
    const scheduleByDay = new Map(schedules.map((item) => [item.dayOfWeek, item]));
    const scheduledMinutesForAttendance = attendances.reduce((sum, item) => {
        if (!item.checkIn)
            return sum;
        const schedule = scheduleByDay.get((0, dayjs_1.default)(item.date).tz(shop.timezone).day());
        if (!schedule || schedule.isOff)
            return sum;
        const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
        const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
        return sum + (endHour * 60 + endMinute - startHour * 60 - startMinute);
    }, 0);
    const overtimeMinutes = Math.max(0, totalWorkMinutes - scheduledMinutesForAttendance);
    const customCommissionByService = new Map(commissions.map((item) => [item.serviceId, item]));
    const lineItems = [];
    let totalRevenue = 0;
    let commissionTotal = 0;
    let totalServices = 0;
    for (const appointment of appointments) {
        for (const service of appointment.services) {
            totalServices += 1;
            totalRevenue += service.priceAtBooking;
            const custom = customCommissionByService.get(service.serviceId);
            const commissionType = custom?.commissionType ?? config.commissionType;
            const commissionValue = custom?.value ??
                (commissionType === "PERCENT"
                    ? config.defaultCommissionPercent
                    : config.defaultFixedPerService);
            const amount = commissionType === "PERCENT"
                ? service.priceAtBooking * (commissionValue / 100)
                : commissionType === "FIXED_PER_SERVICE"
                    ? commissionValue
                    : 0;
            if (amount <= 0)
                continue;
            commissionTotal += amount;
            lineItems.push({
                type: "COMMISSION",
                description: `Commission for ${service.serviceName}`,
                amount,
                date: appointment.date,
                referenceId: service.id,
            });
        }
    }
    const baseSalary = config.commissionType === "FIXED_PER_DAY"
        ? config.baseSalary * totalWorkDays
        : config.baseSalary;
    if (baseSalary > 0) {
        lineItems.unshift({
            type: "BASE_SALARY",
            description: config.commissionType === "FIXED_PER_DAY"
                ? `Salary for ${totalWorkDays} working days`
                : "Base salary",
            amount: baseSalary,
        });
    }
    const bonusTotal = positiveReviews * config.bonusPerPositiveReview;
    if (bonusTotal > 0) {
        lineItems.push({
            type: "REVIEW_BONUS",
            description: `Bonus for ${positiveReviews} positive reviews`,
            amount: bonusTotal,
        });
    }
    const latePenalty = totalLateMinutes * config.penaltyPerLateMinute;
    const noShowPenalty = noShows * config.penaltyPerNoShow;
    const penaltyTotal = latePenalty + noShowPenalty;
    if (latePenalty > 0) {
        lineItems.push({
            type: "LATE_PENALTY",
            description: `Penalty for ${totalLateMinutes} late minutes`,
            amount: -latePenalty,
        });
    }
    if (noShowPenalty > 0) {
        lineItems.push({
            type: "NO_SHOW_PENALTY",
            description: `Penalty for ${noShows} no-show appointments`,
            amount: -noShowPenalty,
        });
    }
    const baseRatePerMinute = scheduledMinutesForAttendance > 0
        ? baseSalary / scheduledMinutesForAttendance
        : 0;
    const otAmount = overtimeMinutes * baseRatePerMinute * config.otMultiplier;
    if (otAmount > 0) {
        lineItems.push({
            type: "OVERTIME",
            description: `Overtime for ${overtimeMinutes} minutes`,
            amount: otAmount,
        });
    }
    const grossAmount = baseSalary + commissionTotal + bonusTotal + otAmount;
    const netAmount = grossAmount - penaltyTotal;
    return {
        shopId: shop.id,
        userId: staff.userId,
        periodStart,
        periodEnd,
        status: "DRAFT",
        totalWorkDays,
        totalWorkMinutes,
        totalServices,
        totalRevenue,
        baseSalary,
        commissionTotal,
        bonusTotal,
        penaltyTotal,
        otAmount,
        grossAmount,
        netAmount,
        lineItems,
        note: `Generated from salary config ${config.id}`,
    };
};
const generateDraftPayrollsService = async (shopSlug, input, actorUserId, ipAddress) => {
    const shop = await getShop(shopSlug);
    const periodStart = dayjs_1.default
        .tz(input.periodStart, shop.timezone)
        .startOf("day")
        .toDate();
    const periodEnd = dayjs_1.default
        .tz(input.periodEnd, shop.timezone)
        .startOf("day")
        .toDate();
    const queryEnd = dayjs_1.default
        .tz(input.periodEnd, shop.timezone)
        .endOf("day")
        .toDate();
    const staffMembers = await prisma_1.db.shopStaff.findMany({
        where: {
            shopId: shop.id,
            isActive: true,
            ...(input.staffIds ? { id: { in: input.staffIds } } : {}),
        },
        include: {
            user: { select: { name: true, email: true } },
            salaryConfig: true,
        },
    });
    if (input.staffIds && staffMembers.length !== input.staffIds.length) {
        throw new ApiError_1.ApiError(404, "One or more staff members were not found in this shop");
    }
    const created = [];
    const skipped = [];
    for (const staff of staffMembers) {
        if (!staff.salaryConfig) {
            skipped.push({ staffId: staff.id, reason: "Salary configuration is missing" });
            continue;
        }
        if (staff.salaryConfig.effectiveFrom > queryEnd) {
            skipped.push({ staffId: staff.id, reason: "Salary configuration is not yet effective" });
            continue;
        }
        const existing = await prisma_1.db.payroll.findUnique({
            where: {
                shopId_userId_periodStart_periodEnd: {
                    shopId: shop.id,
                    userId: staff.userId,
                    periodStart,
                    periodEnd,
                },
            },
        });
        if (existing) {
            skipped.push({ staffId: staff.id, reason: "Payroll already exists for this period" });
            continue;
        }
        const data = await calculateDraftForStaff(shop, staff, periodStart, periodEnd, queryEnd);
        const payroll = await prisma_1.db.$transaction(async (tx) => {
            const createdPayroll = await tx.payroll.create({ data });
            await writeAudit({
                shopId: shop.id,
                userId: actorUserId,
                action: "PAYROLL_DRAFT_GENERATED",
                entity: "Payroll",
                entityId: createdPayroll.id,
                changes: { staffId: staff.id, periodStart, periodEnd },
                ipAddress,
            }, tx);
            return createdPayroll;
        });
        created.push({ ...payroll, staffId: staff.id });
    }
    return { created, skipped };
};
exports.generateDraftPayrollsService = generateDraftPayrollsService;
const attachStaffIds = async (payrolls) => {
    if (payrolls.length === 0)
        return [];
    const staff = await prisma_1.db.shopStaff.findMany({
        where: {
            OR: payrolls.map((item) => ({
                shopId: item.shopId,
                userId: item.userId,
            })),
        },
        select: { id: true, shopId: true, userId: true },
    });
    const ids = new Map(staff.map((item) => [`${item.shopId}:${item.userId}`, item.id]));
    return payrolls.map((item) => ({
        ...item,
        staffId: ids.get(`${item.shopId}:${item.userId}`) ?? null,
    }));
};
const getPayrollListService = async (shopSlug, query) => {
    const shop = await getShop(shopSlug);
    let userId;
    if (query.staffId) {
        userId = (await getStaff(shop.id, query.staffId)).userId;
    }
    const where = {
        shopId: shop.id,
        ...(userId ? { userId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.periodStart || query.periodEnd
            ? {
                periodStart: {
                    ...(query.periodStart
                        ? {
                            gte: dayjs_1.default
                                .tz(query.periodStart, shop.timezone)
                                .startOf("day")
                                .toDate(),
                        }
                        : {}),
                    ...(query.periodEnd
                        ? {
                            lte: dayjs_1.default
                                .tz(query.periodEnd, shop.timezone)
                                .startOf("day")
                                .toDate(),
                        }
                        : {}),
                },
            }
            : {}),
    };
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const total = await prisma_1.db.payroll.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const payrolls = await prisma_1.db.payroll.findMany({
        where,
        skip: (safePage - 1) * limit,
        take: limit,
        include: { user: { select: { name: true, email: true } } },
        orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }],
    });
    return {
        items: await attachStaffIds(payrolls),
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
exports.getPayrollListService = getPayrollListService;
const getPayrollInShop = async (shopId, payrollId) => {
    const payroll = await prisma_1.db.payroll.findFirst({
        where: { id: payrollId, shopId },
        include: { user: { select: { name: true, email: true } } },
    });
    if (!payroll)
        throw new ApiError_1.ApiError(404, "Payroll not found");
    return payroll;
};
const getPayrollDetailService = async (shopSlug, payrollId) => {
    const shop = await getShop(shopSlug);
    return (await attachStaffIds([await getPayrollInShop(shop.id, payrollId)]))[0];
};
exports.getPayrollDetailService = getPayrollDetailService;
const adjustDraftPayrollService = async (shopSlug, payrollId, input, actorUserId, ipAddress) => {
    const shop = await getShop(shopSlug);
    const payroll = await getPayrollInShop(shop.id, payrollId);
    if (payroll.status !== "DRAFT") {
        throw new ApiError_1.ApiError(409, "Only DRAFT payrolls can be adjusted");
    }
    const isBonus = input.type === "BONUS";
    const otherBonuses = payroll.otherBonuses + (isBonus ? input.amount : 0);
    const otherDeductions = payroll.otherDeductions + (isBonus ? 0 : input.amount);
    const grossAmount = payroll.baseSalary +
        payroll.commissionTotal +
        payroll.bonusTotal +
        payroll.otAmount +
        otherBonuses;
    const netAmount = grossAmount -
        payroll.penaltyTotal -
        payroll.advanceDeduction -
        otherDeductions;
    return prisma_1.db.$transaction(async (tx) => {
        const updated = await tx.payroll.update({
            where: { id: payroll.id },
            data: {
                otherBonuses,
                otherDeductions,
                grossAmount,
                netAmount,
                lineItems: {
                    push: {
                        type: isBonus ? "MANUAL_BONUS" : "MANUAL_DEDUCTION",
                        description: input.description,
                        amount: isBonus ? input.amount : -input.amount,
                        date: new Date(),
                    },
                },
            },
        });
        await writeAudit({
            shopId: shop.id,
            userId: actorUserId,
            action: isBonus ? "PAYROLL_BONUS_ADDED" : "PAYROLL_DEDUCTION_ADDED",
            entity: "Payroll",
            entityId: payroll.id,
            changes: input,
            ipAddress,
        }, tx);
        return updated;
    });
};
exports.adjustDraftPayrollService = adjustDraftPayrollService;
const confirmPayrollService = async (shopSlug, payrollId, actorUserId, ipAddress) => {
    const shop = await getShop(shopSlug);
    const payroll = await getPayrollInShop(shop.id, payrollId);
    if (payroll.status !== "DRAFT") {
        throw new ApiError_1.ApiError(409, "Only DRAFT payrolls can be confirmed");
    }
    return prisma_1.db.$transaction(async (tx) => {
        const updated = await tx.payroll.update({
            where: { id: payroll.id },
            data: {
                status: "CONFIRMED",
                approvedBy: actorUserId,
                approvedAt: new Date(),
            },
        });
        await writeAudit({
            shopId: shop.id,
            userId: actorUserId,
            action: "PAYROLL_CONFIRMED",
            entity: "Payroll",
            entityId: payroll.id,
            changes: { from: "DRAFT", to: "CONFIRMED" },
            ipAddress,
        }, tx);
        return updated;
    });
};
exports.confirmPayrollService = confirmPayrollService;
const payPayrollService = async (shopSlug, payrollId, input, actorUserId, ipAddress) => {
    const shop = await getShop(shopSlug);
    const payroll = await getPayrollInShop(shop.id, payrollId);
    if (payroll.status !== "CONFIRMED") {
        throw new ApiError_1.ApiError(409, "Only CONFIRMED payrolls can be paid");
    }
    return prisma_1.db.$transaction(async (tx) => {
        const updated = await tx.payroll.update({
            where: { id: payroll.id },
            data: {
                status: "PAID",
                paidAt: new Date(),
                paymentMethod: input.paymentMethod,
                paymentNote: input.paymentNote,
            },
        });
        await writeAudit({
            shopId: shop.id,
            userId: actorUserId,
            action: "PAYROLL_PAID",
            entity: "Payroll",
            entityId: payroll.id,
            changes: input,
            ipAddress,
        }, tx);
        return updated;
    });
};
exports.payPayrollService = payPayrollService;
const getMyPayrollsService = async (shopSlug, userId) => {
    const shop = await getShop(shopSlug);
    await prisma_1.db.shopStaff.findFirstOrThrow({
        where: { shopId: shop.id, userId, isActive: true },
    });
    const payrolls = await prisma_1.db.payroll.findMany({
        where: { shopId: shop.id, userId, status: { in: ["CONFIRMED", "PAID"] } },
        orderBy: { periodStart: "desc" },
    });
    return attachStaffIds(payrolls);
};
exports.getMyPayrollsService = getMyPayrollsService;
const getMyPayrollDetailService = async (shopSlug, userId, payrollId) => {
    const shop = await getShop(shopSlug);
    const payroll = await prisma_1.db.payroll.findFirst({
        where: {
            id: payrollId,
            shopId: shop.id,
            userId,
            status: { in: ["CONFIRMED", "PAID"] },
        },
    });
    if (!payroll)
        throw new ApiError_1.ApiError(404, "Payslip not found");
    return (await attachStaffIds([payroll]))[0];
};
exports.getMyPayrollDetailService = getMyPayrollDetailService;
