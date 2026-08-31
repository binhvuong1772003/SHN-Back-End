"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSlots = void 0;
const prisma_1 = require("../../db/prisma");
const ApiError_1 = require("../../utils/ApiError");
const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};
const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};
const addMinutesToTime = (time, minutes) => {
    return minutesToTime(timeToMinutes(time) + minutes);
};
const getAvailableSlots = async (data) => {
    const { shopSlug, date, serviceIds } = data;
    const shop = await prisma_1.db.shop.findUnique({
        where: { slug: shopSlug },
    });
    if (!shop)
        throw new ApiError_1.ApiError(404, 'Shop not found');
};
exports.getAvailableSlots = getAvailableSlots;
