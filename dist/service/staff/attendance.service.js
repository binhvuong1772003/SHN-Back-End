"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOutService = exports.checkInService = exports.qrCheckOutService = exports.qrCheckInService = exports.generateCheckOutQRService = exports.generateCheckInQRService = exports.generateDailyToken = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const crypto_1 = __importDefault(require("crypto"));
const generateDailyToken = async (shopId) => {
    const today = new Date().toISOString().split('T')[0];
    return crypto_1.default
        .createHmac('sha256', process.env.QR_SECRET)
        .update(`${shopId}:${today}`)
        .digest('hex');
};
exports.generateDailyToken = generateDailyToken;
const generateCheckInQRService = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const QRCode = await Promise.resolve().then(() => __importStar(require('qrcode')));
    const token = await (0, exports.generateDailyToken)(shop.id);
    const url = `${process.env.FRONTEND_URL}/${shopSlug}/check-in?token=${token}`;
    return QRCode.default.toDataURL(url);
};
exports.generateCheckInQRService = generateCheckInQRService;
const generateCheckOutQRService = async (shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const QRCode = await Promise.resolve().then(() => __importStar(require('qrcode')));
    const token = await (0, exports.generateDailyToken)(shop.id);
    const url = `${process.env.FRONTEND_URL}/${shopSlug}/check-out?token=${token}`;
    return QRCode.default.toDataURL(url);
};
exports.generateCheckOutQRService = generateCheckOutQRService;
const qrCheckInService = async (token, shopSlug, userId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    // Verify token có đúng ngày hôm nay không
    const expectedToken = await (0, exports.generateDailyToken)(shop.id);
    if (token !== expectedToken)
        throw new ApiError_1.ApiError(400, 'QR không hợp lệ hoặc đã hết hạn');
    // Gọi lại checkInService như bình thường
    return (0, exports.checkInService)(userId, shopSlug);
};
exports.qrCheckInService = qrCheckInService;
const qrCheckOutService = async (token, shopSlug, userId) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const expectedToken = await (0, exports.generateDailyToken)(shop.id);
    if (token !== expectedToken)
        throw new ApiError_1.ApiError(400, 'QR không hợp lệ hoặc đã hết hạn');
    return (0, exports.checkOutService)(userId, shopSlug);
};
exports.qrCheckOutService = qrCheckOutService;
const checkInService = async (userId, shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { userId, shopId: shop.id, isActive: true },
    });
    if (!staff)
        throw new ApiError_1.ApiError(404, 'Không tìm thấy staff');
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await prisma_1.db.attendance.findUnique({
        where: {
            shopStaffId_date: {
                shopStaffId: staff.id,
                date: today,
            },
        },
    });
    if (!attendance)
        throw new ApiError_1.ApiError(404, 'Attendance không tồn tại');
    if (attendance.checkIn)
        throw new ApiError_1.ApiError(400, 'Checked in rồi');
    const dayOfWeek = now.getDay();
    const schedule = await prisma_1.db.staffSchedule.findFirst({
        where: { shopStaffId: staff.id, dayOfWeek },
    });
    let lateMinutes = 0;
    let status = attendance.status;
    if (schedule) {
        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
        const scheduledStart = new Date(today);
        scheduledStart.setHours(startHour, startMin, 0, 0);
        if (now > scheduledStart) {
            lateMinutes = Math.floor((now.getTime() - scheduledStart.getTime()) / (1000 * 60));
            status = 'LATE';
        }
        else {
            status = 'PRESENT';
        }
    }
    return await prisma_1.db.attendance.update({
        where: { id: attendance.id },
        data: { checkIn: now, lateMinutes, status },
    });
};
exports.checkInService = checkInService;
const checkOutService = async (userId, shopSlug) => {
    const shop = await prisma_1.db.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop không tồn tại');
    const staff = await prisma_1.db.shopStaff.findFirst({
        where: { userId, shopId: shop.id, isActive: true },
    });
    if (!staff)
        throw new ApiError_1.ApiError(404, 'Không tìm thấy staff');
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await prisma_1.db.attendance.findUnique({
        where: {
            shopStaffId_date: {
                shopStaffId: staff.id,
                date: today,
            },
        },
    });
    if (!attendance)
        throw new ApiError_1.ApiError(404, 'Attendance không tồn tại');
    if (!attendance.checkIn)
        throw new ApiError_1.ApiError(400, 'Chưa check in');
    if (attendance.checkOut)
        throw new ApiError_1.ApiError(400, 'Checked out rồi');
    const checkOutTime = new Date();
    const workedHours = (checkOutTime.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);
    return await prisma_1.db.attendance.update({
        where: { id: attendance.id },
        data: { checkOut: checkOutTime, workHours: Math.floor(workedHours) },
    });
};
exports.checkOutService = checkOutService;
