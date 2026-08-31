import { ApiError } from "@/utils/ApiError";
import {
  acceptInviteService,
  inviteStaffService,
  updateStaffInfoService,
  updateStaffScheduleService,
  deleteStaffScheduleService,
  getStaffScheduleService,
  getStaffDetailService,
  getStaffListByShopService,
} from "@/service/staff/staff.service";
import type { ShopRole } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "@/utils/apiResponse";
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
      throw new ApiError(403, "Managers can only add staff members");
    }
    const shopSlug = req.params.shopSlug as string;
    const invitedBy = req.user!.userId;
    const result = await inviteStaffService(
      shopSlug,
      invitedEmail,
      role,
      invitedBy,
    );
    sendSuccess(res, result);
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
    sendSuccess(res, result);
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
    const { role, permissions, isActive } = req.body;
    const canChangeRole =
      req.user?.role === "SUPER_ADMIN" || req.shopStaff?.role === "OWNER";
    if ((role !== undefined || permissions !== undefined) && !canChangeRole) {
      throw new ApiError(403, "Only the shop owner can change staff roles or permissions");
    }
    const updatedStaff = await updateStaffInfoService(shopSlug, staffId, {
      role,
      permissions,
      isActive,
    });
    return sendSuccess(res, updatedStaff);
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
    const schedule = req.body;
    const updatedSchedule = await updateStaffScheduleService(
      shopSlug,
      staffId,
      schedule,
    );
    return sendSuccess(res, updatedSchedule);
  } catch (error) {
    next(error);
  }
};
export const deleteStaffScheduleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { shopSlug, staffId } = req.params as {
      shopSlug: string;
      staffId: string;
    };
    const result = await deleteStaffScheduleService(shopSlug, staffId);
    return sendSuccess(res, result);
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
    return sendSuccess(res, schedule);
  } catch (error) {
    next(error);
  }
};
export const getStaffDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await getStaffDetailService(
      req.params.shopSlug as string,
      req.params.staffId as string,
    );
    return sendSuccess(res, result);
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
    return sendSuccess(res, result.items, { meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages, hasNext: result.page < result.totalPages, hasPrev: result.page > 1 } });
  } catch (error) {
    next(error);
  }
};
