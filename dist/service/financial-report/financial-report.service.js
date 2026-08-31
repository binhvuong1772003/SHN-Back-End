"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialReportService = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const sum = (values) => values.reduce((total, value) => total + value, 0);
const round = (value) => Math.round(value * 100) / 100;
const toPeriod = (periodStart, periodEnd, shopTimezone) => {
    const start = dayjs_1.default.tz(periodStart, shopTimezone).startOf("day");
    const end = dayjs_1.default.tz(periodEnd, shopTimezone).add(1, "day").startOf("day");
    return {
        start: start.toDate(),
        endExclusive: end.toDate(),
        startLabel: start.format("YYYY-MM-DD"),
        endLabel: end.subtract(1, "day").format("YYYY-MM-DD"),
    };
};
const previousPeriod = (period, shopTimezone) => {
    const days = (0, dayjs_1.default)(period.endExclusive).diff((0, dayjs_1.default)(period.start), "day");
    const end = dayjs_1.default.tz(period.start, shopTimezone).startOf("day");
    const start = end.subtract(days, "day");
    return {
        start: start.toDate(),
        endExclusive: end.toDate(),
        startLabel: start.format("YYYY-MM-DD"),
        endLabel: end.subtract(1, "day").format("YYYY-MM-DD"),
    };
};
const paidAmount = (payment, totalAmount) => payment?.paidAmount || totalAmount;
const aggregatePeriod = async (shopId, period, shopTimezone) => {
    const [appointments, payrolls] = await Promise.all([
        prisma_1.db.appointment.findMany({
            where: {
                shopId,
                status: "DONE",
                date: { gte: period.start, lt: period.endExclusive },
                payment: { is: { status: "PAID" } },
            },
            select: {
                date: true,
                totalAmount: true,
                staffId: true,
                staff: { select: { name: true, email: true } },
                payment: { select: { paidAmount: true, method: true } },
                services: {
                    select: {
                        serviceName: true,
                        priceAtBooking: true,
                        selectedValues: { select: { priceAtBooking: true } },
                    },
                },
                packages: {
                    select: {
                        priceAtBooking: true,
                        addons: { select: { extraPrice: true } },
                    },
                },
                addons: { select: { priceAtBooking: true } },
            },
        }),
        prisma_1.db.payroll.findMany({
            where: {
                shopId,
                status: { in: ["CONFIRMED", "PAID"] },
                periodStart: { lte: period.endExclusive },
                periodEnd: { gte: period.start },
            },
            select: {
                userId: true,
                grossAmount: true,
                netAmount: true,
                baseSalary: true,
                commissionTotal: true,
                bonusTotal: true,
                penaltyTotal: true,
                otAmount: true,
                advanceDeduction: true,
                otherDeductions: true,
                otherBonuses: true,
                user: { select: { name: true, email: true } },
            },
        }),
    ]);
    const trend = new Map();
    const paymentMethods = new Map();
    const revenueBreakdown = new Map();
    const serviceMap = new Map();
    const staffMap = new Map();
    let revenue = 0;
    for (const appointment of appointments) {
        const amount = paidAmount(appointment.payment, appointment.totalAmount);
        const date = (0, dayjs_1.default)(appointment.date).tz(shopTimezone).format("YYYY-MM-DD");
        revenue += amount;
        trend.set(date, (trend.get(date) ?? 0) + amount);
        paymentMethods.set(appointment.payment?.method ?? "UNKNOWN", (paymentMethods.get(appointment.payment?.method ?? "UNKNOWN") ?? 0) +
            amount);
        if (appointment.staffId) {
            const staff = staffMap.get(appointment.staffId) ?? {
                name: appointment.staff?.name ?? "Unknown staff",
                email: appointment.staff?.email ?? undefined,
                appointments: 0,
                revenue: 0,
            };
            staff.appointments += 1;
            staff.revenue += amount;
            staffMap.set(appointment.staffId, staff);
        }
        for (const service of appointment.services) {
            const serviceRevenue = service.priceAtBooking +
                sum(service.selectedValues.map((value) => value.priceAtBooking));
            revenueBreakdown.set("SERVICES", (revenueBreakdown.get("SERVICES") ?? 0) + serviceRevenue);
            const item = serviceMap.get(service.serviceName) ?? {
                appointments: 0,
                revenue: 0,
            };
            item.appointments += 1;
            item.revenue += serviceRevenue;
            serviceMap.set(service.serviceName, item);
        }
        for (const servicePackage of appointment.packages) {
            const packageRevenue = servicePackage.priceAtBooking +
                sum(servicePackage.addons.map((addon) => addon.extraPrice));
            revenueBreakdown.set("PACKAGES", (revenueBreakdown.get("PACKAGES") ?? 0) + packageRevenue);
        }
        for (const addon of appointment.addons) {
            revenueBreakdown.set("ADD_ONS", (revenueBreakdown.get("ADD_ONS") ?? 0) + addon.priceAtBooking);
        }
    }
    const payroll = payrolls.length
        ? {
            records: payrolls.length,
            cost: round(sum(payrolls.map((item) => item.grossAmount))),
            baseSalary: round(sum(payrolls.map((item) => item.baseSalary))),
            commission: round(sum(payrolls.map((item) => item.commissionTotal))),
            bonus: round(sum(payrolls.map((item) => item.bonusTotal + item.otherBonuses))),
            deductions: round(sum(payrolls.map((item) => item.penaltyTotal +
                item.advanceDeduction +
                item.otherDeductions))),
            overtime: round(sum(payrolls.map((item) => item.otAmount))),
            netPaid: round(sum(payrolls.map((item) => item.netAmount))),
        }
        : null;
    const staffPayroll = new Map();
    for (const item of payrolls) {
        staffPayroll.set(item.userId, (staffPayroll.get(item.userId) ?? 0) + item.commissionTotal);
    }
    return {
        dataAvailable: appointments.length > 0 || payrolls.length > 0,
        revenue: round(revenue),
        completedAppointments: appointments.length,
        averageTicket: appointments.length
            ? round(revenue / appointments.length)
            : 0,
        payroll,
        revenueAfterPayroll: payroll ? round(revenue - payroll.cost) : null,
        trend: Array.from(trend, ([date, value]) => ({
            date,
            revenue: round(value),
        })).sort((a, b) => a.date.localeCompare(b.date)),
        revenueBreakdown: Array.from(revenueBreakdown, ([key, value]) => ({
            key,
            revenue: round(value),
        })).sort((a, b) => b.revenue - a.revenue),
        topServices: Array.from(serviceMap, ([name, value]) => ({
            name,
            appointments: value.appointments,
            revenue: round(value.revenue),
            averageTicket: round(value.revenue / value.appointments),
        }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8),
        staffPerformance: Array.from(staffMap, ([staffId, value]) => ({
            staffId,
            ...value,
            revenue: round(value.revenue),
            commission: round(staffPayroll.get(staffId) ?? 0),
        }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8),
        paymentMethods: Array.from(paymentMethods, ([method, value]) => ({
            method,
            revenue: round(value),
        })).sort((a, b) => b.revenue - a.revenue),
    };
};
const getFinancialReportService = async (shopSlug, query) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, "Shop not found");
    const currentPeriod = toPeriod(query.periodStart, query.periodEnd, shop.timezone);
    const previous = previousPeriod(currentPeriod, shop.timezone);
    const [current, previousData] = await Promise.all([
        aggregatePeriod(shop.id, currentPeriod, shop.timezone),
        aggregatePeriod(shop.id, previous, shop.timezone),
    ]);
    return {
        period: {
            start: currentPeriod.startLabel,
            end: currentPeriod.endLabel,
            previousStart: previous.startLabel,
            previousEnd: previous.endLabel,
        },
        current,
        previous: {
            revenue: previousData.revenue,
            payrollCost: previousData.payroll?.cost ?? null,
            revenueAfterPayroll: previousData.revenueAfterPayroll,
            completedAppointments: previousData.completedAppointments,
            dataAvailable: previousData.dataAvailable,
        },
        coverage: {
            revenue: true,
            payroll: current.payroll !== null,
            operatingExpenses: false,
            paymentMethods: current.paymentMethods.length > 0,
        },
    };
};
exports.getFinancialReportService = getFinancialReportService;
