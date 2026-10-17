import { Request, Response, NextFunction } from 'express';
import {
  requestOffDayService,
  responseOffDayService,
  getListOffDayService,
  getDetailOffDayService,
} from '@/service/staff/offDay.service';
import { ApiError } from '@/utils/ApiError';
import { sendSuccess } from '@/utils/apiResponse';
export const requestOffDayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopSlug, staffId } = req.params as {
      shopSlug: string;
      staffId: string;
    };
    const data = req.body;
    const result = await requestOffDayService(
      shopSlug,
      staffId,
      req.user!.userId,
      data,
    );
    sendSuccess(res, result, { statusCode: 201 });
  } catch (error) {
    next(error);
  }
};
export const responseOffDayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopSlug, offDayId } = req.params;
    const data = req.body;
    const result = await responseOffDayService(
      shopSlug as string,
      offDayId as string,
      req.user!.userId,
      data,
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
export const getListOffDayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopSlug } = req.params;
    const assignedToMe = (req.query as unknown as { assignedToMe?: boolean | string }).assignedToMe === true
      || (req.query as unknown as { assignedToMe?: boolean | string }).assignedToMe === 'true';
    if (!assignedToMe && req.shopStaff?.role === 'STAFF') {
      throw new ApiError(403, 'You cannot view another staff member\'s leave requests');
    }
    const rawPage = Number(req.query.page ?? 1);
    const rawLimit = Number(req.query.limit ?? 10);
    const rawStatus = typeof req.query.status === 'string'
      ? req.query.status.toUpperCase()
      : undefined;
    const status = rawStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(rawStatus)
      ? rawStatus as 'PENDING' | 'APPROVED' | 'REJECTED'
      : undefined;
    const result = await getListOffDayService(
      shopSlug as string,
      assignedToMe ? req.user!.userId : undefined,
      {
        page: Number.isFinite(rawPage) ? rawPage : 1,
        limit: Number.isFinite(rawLimit) ? rawLimit : 10,
        status,
        staffId: typeof req.query.staffId === 'string' ? req.query.staffId : undefined,
      },
    );
    sendSuccess(res, result.items, { meta: { ...result.meta, hasNext: result.meta.page < result.meta.totalPages, hasPrev: result.meta.page > 1 } });
  } catch (error) {
    next(error);
  }
};
export const getDetailDayOffController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { offDayId } = req.params;
    const result = await getDetailOffDayService(offDayId as string);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
