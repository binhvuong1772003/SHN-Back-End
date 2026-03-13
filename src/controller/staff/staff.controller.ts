import { updateShopService } from '@/service/shop/shop.service';
import {
  acceptInviteService,
  inviteStaffService,
  updateStaffInfoService,
  updateStaffScheduleService,
} from '@/service/staff/staff.service';
import { Request, Response, NextFunction } from 'express';
export const inviteStaffController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('body:', req.body);
    const { invitedEmail, role } = req.body;
    const shopSlug = req.params.shopSlug as string;
    const invitedBy = req.user!.userId;
    const result = await inviteStaffService(
      shopSlug,
      invitedEmail,
      role,
      invitedBy
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
export const acceptInviteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.query;
    const userId = req.user!.userId;
    const result = await acceptInviteService(token as string, userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
export const updateStaffInfoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopSlug, staffId } = req.params as {
      shopSlug: string;
      staffId: string;
    };
    const { role, isActive } = req.body;
    const updatedStaff = await updateStaffInfoService(shopSlug, staffId, {
      role,
      isActive,
    });
    return res.status(200).json({ success: true, data: updatedStaff });
  } catch (error) {
    next(error);
  }
};
export const updateStaffScheduleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopSlug, staffId } = req.params as {
      shopSlug: string;
      staffId: string;
    };
    const { schedule } = req.body;
    const updatedSchedule = await updateStaffScheduleService(
      shopSlug,
      staffId,
      {
        schedule,
      }
    );
    return res.status(200).json({ success: true, data: updatedSchedule });
  } catch (error) {
    next(error);
  }
};
