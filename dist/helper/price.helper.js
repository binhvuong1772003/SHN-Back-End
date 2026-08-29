"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementPromotionUsage = exports.priceDiscountCalculate = void 0;
const prisma_1 = require("@/db/prisma");
const ApiError_1 = require("@/utils/ApiError");
const priceDiscountCalculate = async (subtotal, discount, promotionId) => {
    let discountAmount = 0;
    if (promotionId) {
        const promotion = await prisma_1.db.promotion.findUnique({
            where: { id: promotionId },
        });
        if (!promotion)
            throw new ApiError_1.ApiError(404, 'Mã khuyến mãi không tồn tại');
        if (!promotion.isActive)
            throw new ApiError_1.ApiError(400, 'Mã khuyến mãi không còn hiệu lực');
        if (new Date() < promotion.startDate || new Date() > promotion.endDate)
            throw new ApiError_1.ApiError(400, 'Mã khuyến mãi chưa hoặc đã hết hạn');
        if (promotion.maxUses && promotion.usedCount >= promotion.maxUses)
            throw new ApiError_1.ApiError(400, 'Mã khuyến mãi đã hết lượt sử dụng');
        if (subtotal < promotion.minOrderAmount)
            throw new ApiError_1.ApiError(400, `Đơn tối thiểu ${promotion.minOrderAmount}đ để dùng mã này`);
        if (promotion.type === 'PERCENT') {
            discountAmount = subtotal * (promotion.value / 100);
            if (promotion.maxDiscount)
                discountAmount = Math.min(discountAmount, promotion.maxDiscount);
        }
        else {
            discountAmount = promotion.value;
        }
        discountAmount = Math.min(discountAmount, subtotal);
    }
    return [subtotal - discountAmount, discountAmount];
};
exports.priceDiscountCalculate = priceDiscountCalculate;
const incrementPromotionUsage = async (promotionId) => {
    await prisma_1.db.promotion.update({
        where: { id: promotionId },
        data: { usedCount: { increment: 1 } },
    });
};
exports.incrementPromotionUsage = incrementPromotionUsage;
