import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';

export const priceDiscountCalculate = async (
  subtotal: number,
  discount: number,
  promotionId: string
) => {
  let discountAmount = 0;
  if (promotionId) {
    const promotion = await db.promotion.findUnique({
      where: { id: promotionId },
    });
    if (!promotion) throw new ApiError(404, 'Mã khuyến mãi không tồn tại');
    if (!promotion.isActive)
      throw new ApiError(400, 'Mã khuyến mãi không còn hiệu lực');
    if (new Date() < promotion.startDate || new Date() > promotion.endDate)
      throw new ApiError(400, 'Mã khuyến mãi chưa hoặc đã hết hạn');
    if (promotion.maxUses && promotion.usedCount >= promotion.maxUses)
      throw new ApiError(400, 'Mã khuyến mãi đã hết lượt sử dụng');
    if (subtotal < promotion.minOrderAmount)
      throw new ApiError(
        400,
        `Đơn tối thiểu ${promotion.minOrderAmount}đ để dùng mã này`
      );

    if (promotion.type === 'PERCENT') {
      discountAmount = subtotal * (promotion.value / 100);
      if (promotion.maxDiscount)
        discountAmount = Math.min(discountAmount, promotion.maxDiscount);
    } else {
      discountAmount = promotion.value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }
  return [subtotal - discountAmount, discountAmount];
};

export const incrementPromotionUsage = async (promotionId: string) => {
  await db.promotion.update({
    where: { id: promotionId },
    data: { usedCount: { increment: 1 } },
  });
};
