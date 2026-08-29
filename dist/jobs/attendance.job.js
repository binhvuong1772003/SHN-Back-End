"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDailyAttendance = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("@/db/prisma");
const createDailyAttendance = async () => {
    console.log('⏰ Tạo record chấm công...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allStaff = await prisma_1.db.shopStaff.findMany({
        where: { isActive: true },
    });
    for (const staff of allStaff) {
        const approvedOffDay = await prisma_1.db.staffOffDay.findFirst({
            where: {
                shopStaffId: staff.id,
                status: 'APPROVED',
                offDate: { lte: today },
                OR: [
                    { offDateEnd: null, offDate: today },
                    { offDateEnd: { gte: today } },
                ],
            },
        });
        const existing = await prisma_1.db.attendance.findUnique({
            where: {
                shopStaffId_date: {
                    shopStaffId: staff.id,
                    date: today,
                },
            },
        });
        if (existing)
            continue;
        await prisma_1.db.attendance.create({
            data: {
                shopStaffId: staff.id,
                date: today,
                status: approvedOffDay ? 'DAY_OFF_APPROVED' : 'ABSENT',
            },
        });
    }
    console.log(`✅ Tạo xong record cho ${allStaff.length} staff`);
};
exports.createDailyAttendance = createDailyAttendance;
node_cron_1.default.schedule('0 0 * * *', exports.createDailyAttendance);
