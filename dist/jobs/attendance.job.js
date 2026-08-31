"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeAttendance = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const prisma_1 = require("../db/prisma");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};
const getBusinessDay = (shop, date) => {
    const dayOfWeek = date.day();
    const configured = shop.businessHours.find((item) => item.dayOfWeek === dayOfWeek);
    if (configured) {
        return {
            isClosed: configured.isClosed,
            closeTime: configured.closeTime,
            dayOfWeek,
        };
    }
    const workDays = shop.workDays.map((day) => (day === 7 ? 0 : day));
    return {
        isClosed: !workDays.includes(dayOfWeek),
        closeTime: shop.closeTime,
        dayOfWeek,
    };
};
const finalizeShopDate = async (shop, localDate) => {
    const businessDay = getBusinessDay(shop, localDate);
    if (businessDay.isClosed)
        return 0;
    const date = localDate.startOf("day").toDate();
    const end = localDate.endOf("day").toDate();
    const schedules = await prisma_1.db.staffSchedule.findMany({
        where: {
            dayOfWeek: businessDay.dayOfWeek,
            isOff: false,
            shopStaff: { shopId: shop.id, isActive: true },
        },
        select: { shopStaffId: true },
    });
    const staffIds = schedules.map((item) => item.shopStaffId);
    if (staffIds.length === 0)
        return 0;
    const approvedOffDays = await prisma_1.db.staffOffDay.findMany({
        where: {
            shopStaffId: { in: staffIds },
            status: "APPROVED",
            OR: [
                { offDate: { gte: date, lte: end }, offDateEnd: null },
                { offDate: { lte: end }, offDateEnd: { gte: date } },
            ],
        },
        select: { shopStaffId: true },
    });
    const offStaffIds = new Set(approvedOffDays.map((item) => item.shopStaffId));
    let absentCount = 0;
    for (const staffId of staffIds) {
        if (offStaffIds.has(staffId))
            continue;
        const attendance = await prisma_1.db.attendance.findUnique({
            where: { shopStaffId_date: { shopStaffId: staffId, date } },
        });
        if (attendance?.checkIn)
            continue;
        if (attendance?.status === "ABSENT")
            continue;
        if (attendance) {
            await prisma_1.db.attendance.update({
                where: { id: attendance.id },
                data: { status: "ABSENT" },
            });
        }
        else {
            await prisma_1.db.attendance.create({
                data: { shopStaffId: staffId, date, status: "ABSENT" },
            });
        }
        absentCount += 1;
    }
    return absentCount;
};
const finalizeAttendance = async () => {
    const shops = await prisma_1.db.shop.findMany({
        where: { status: "ACTIVE" },
        include: { businessHours: true },
    });
    let total = 0;
    for (const shop of shops) {
        const now = (0, dayjs_1.default)().tz(shop.timezone);
        total += await finalizeShopDate(shop, now.subtract(1, "day"));
        const businessDay = getBusinessDay(shop, now);
        const currentMinutes = now.hour() * 60 + now.minute();
        if (!businessDay.isClosed &&
            currentMinutes >= timeToMinutes(businessDay.closeTime)) {
            total += await finalizeShopDate(shop, now);
        }
    }
    console.log(`[Attendance] Marked ${total} records as ABSENT`);
};
exports.finalizeAttendance = finalizeAttendance;
node_cron_1.default.schedule("*/15 * * * *", () => {
    void (0, exports.finalizeAttendance)().catch((error) => {
        console.error("[Attendance] Finalizer failed:", error);
    });
});
