import { ApiError } from "@/utils/ApiError";
import {
  acceptInviteService,
  inviteStaffService,
  updateStaffInfoService,
  updateStaffScheduleService,
  getStaffScheduleService,
  getStaffListByShopService,
} from "@/service/staff/staff.service";
import type { ShopRole } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
export const inviteStaffController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("body:", req.body);
    const { invitedEmail, role } = req.body;
    const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
    if (!isSuperAdmin && req.shopStaff?.role === "MANAGER" && role !== "STAFF") {
      throw new ApiError(403, "Quản lý chỉ được thêm nhân viên");
    }
    const shopSlug = req.params.shopSlug as string;
    const invitedBy = req.user!.userId;
    const result = await inviteStaffService(
      shopSlug,
      invitedEmail,
      role,
      invitedBy,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
export const acceptInviteController = async (
  req: Request,
  res: Response,
  next: NextFunction,
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
  next: NextFunction,
) => {
  try {
    const { shopSlug, staffId } = req.params as {
      shopSlug: string;
      staffId: string;
    };
    const { role, isActive } = req.body;
    const canChangeRole =
      req.user?.role === "SUPER_ADMIN" || req.shopStaff?.role === "OWNER";
    if (role !== undefined && !canChangeRole) {
      throw new ApiError(403, "Chỉ chủ shop được thay đổi vai trò nhân viên");
    }
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
  next: NextFunction,
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
      },
    );
    return res.status(200).json({ success: true, data: updatedSchedule });
  } catch (error) {
    next(error);
  }
};
export const getStaffScheduleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { shopSlug, staffId } = req.params as {
      shopSlug: string;
      staffId: string;
    };
    const schedule = await getStaffScheduleService(shopSlug, staffId);
    return res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};
export const getStaffListByShopController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { shopSlug } = req.params as {
      shopSlug: string;
    };
    const rawPage = Number(req.query.page ?? 1);
    const rawLimit = Number(req.query.limit ?? 5);
    const role = req.query.role as ShopRole | undefined;
    const status = req.query.status as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | undefined;
    const sort = req.query.sort as "RECENT" | "NAME_ASC" | "NAME_DESC" | "REVENUE" | undefined;
    const result = await getStaffListByShopService(shopSlug, {
      page: Number.isFinite(rawPage) ? rawPage : 1,
      limit: Number.isFinite(rawLimit) ? rawLimit : 5,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      role,
      status,
      sort,
    });
    return res.status(200).json({ success: true, data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
  } catch (error) {
    next(error);
  }
};
