import { db } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import type { GetAvailableSlotsInput } from '@/validation/appointment';
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const addMinutesToTime = (time: string, minutes: number): string => {
  return minutesToTime(timeToMinutes(time) + minutes);
};
export const getAvailableSlots = async (data: GetAvailableSlotsInput) => {
  const { shopSlug, date, serviceIds } = data;
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
  });
  if (!shop) throw new ApiError(404, 'Shop not found');
};
