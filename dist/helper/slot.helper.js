"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSlotAvailability = exports.filterAvailableSlots = exports.isStaffAvailable = exports.generateSlots = exports.addMinutesToTime = exports.minutesToTime = exports.timeToMinutes = exports.getAppointmentsWithGridPosition = exports.getBusyAppointments = void 0;
// helpers/slot.helper.ts
const prisma_1 = require("@/db/prisma");
const getBusyAppointments = async (shopId, date, staffId) => {
    // Convert ShopStaff.id to userId if staffId provided (Appointment.staffId references User.id)
    let userId = undefined;
    if (staffId) {
        const shopStaff = await prisma_1.db.shopStaff.findFirst({
            where: { id: staffId, shopId, isActive: true },
        });
        if (shopStaff) {
            userId = shopStaff.userId;
        }
    }
    return prisma_1.db.appointment.findMany({
        where: {
            shopId,
            date,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            ...(userId && { staffId: userId }),
        },
        select: { startTime: true, endTime: true, staffId: true },
    });
};
exports.getBusyAppointments = getBusyAppointments;
const getAppointmentsWithGridPosition = async (shopId, date, timeSlots) => {
    const appointments = await prisma_1.db.appointment.findMany({
        where: {
            shopId,
            date,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        select: {
            id: true,
            startTime: true,
            endTime: true,
            staffId: true,
            status: true,
            customer: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
            services: {
                select: {
                    serviceName: true,
                },
            },
        },
    });
    const getGridRowEnd = (endTime) => {
        const index = timeSlots.findIndex((slot) => slot >= endTime);
        return index !== -1 ? index + 1 : timeSlots.length + 1;
    };
    const newAppointments = appointments.map((apt) => {
        // Tìm index của startTime và endTime trong timeSlots array
        const gridRowStart = timeSlots.indexOf(apt.startTime) + 1; // +1 vì grid row bắt đầu từ 1
        const gridRowEnd = getGridRowEnd(apt.endTime);
        return {
            ...apt,
            gridRowStart,
            gridRowEnd,
        };
    });
    return newAppointments;
};
exports.getAppointmentsWithGridPosition = getAppointmentsWithGridPosition;
const timeToMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};
exports.timeToMinutes = timeToMinutes;
const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
};
exports.minutesToTime = minutesToTime;
const addMinutesToTime = (time, minutes) => {
    return (0, exports.minutesToTime)((0, exports.timeToMinutes)(time) + minutes);
};
exports.addMinutesToTime = addMinutesToTime;
const generateSlots = (openTime, closeTime, intervalMinutes, durationMin) => {
    const slots = [];
    let current = (0, exports.timeToMinutes)(openTime);
    const end = (0, exports.timeToMinutes)(closeTime);
    while (current + durationMin <= end) {
        slots.push((0, exports.minutesToTime)(current));
        current += intervalMinutes;
    }
    return slots;
};
exports.generateSlots = generateSlots;
const isStaffAvailable = async (staffId, shopId, dayOfWeek, date) => {
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { shopId, id: staffId, isActive: true },
    });
    if (!staff)
        return { available: false, reason: "Staff không tồn tại" };
    // Check lịch làm việc theo thứ
    const schedule = await prisma_1.db.staffSchedule.findFirst({
        where: { shopStaffId: staff.id, dayOfWeek },
    });
    if (!schedule || schedule.isOff) {
        return { available: false, reason: "Staff không làm ngày này" };
    }
    // Check off day được duyệt
    const offDay = await prisma_1.db.staffOffDay.findFirst({
        where: {
            shopStaffId: staff.id,
            status: "APPROVED",
            offDate: { lte: date },
            OR: [{ offDateEnd: null, offDate: date }, { offDateEnd: { gte: date } }],
        },
    });
    if (offDay)
        return { available: false, reason: "Staff đang nghỉ phép" };
    return { available: true };
};
exports.isStaffAvailable = isStaffAvailable;
const filterAvailableSlots = (allSlots, busyAppointments, durationMin) => {
    return allSlots.filter((slotStart) => {
        const slotEnd = (0, exports.addMinutesToTime)(slotStart, durationMin);
        return !busyAppointments.some((appt) => slotStart < appt.endTime && slotEnd > appt.startTime);
    });
};
exports.filterAvailableSlots = filterAvailableSlots;
const checkSlotAvailability = async (shopId, date, startTime, endTime, staffId) => {
    // Convert ShopStaff.id to userId if staffId provided (Appointment.staffId references User.id)
    let userId = undefined;
    if (staffId) {
        const shopStaff = await prisma_1.db.shopStaff.findFirst({
            where: { id: staffId, shopId, isActive: true },
        });
        if (shopStaff) {
            userId = shopStaff.userId;
        }
    }
    const conflict = await prisma_1.db.appointment.findFirst({
        where: {
            shopId,
            date,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            ...(userId && { staffId: userId }),
            AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
        },
    });
    if (conflict) {
        return {
            available: false,
            reason: "Slot này đã có người đặt, vui lòng chọn giờ khác",
        };
    }
    return { available: true };
};
exports.checkSlotAvailability = checkSlotAvailability;
