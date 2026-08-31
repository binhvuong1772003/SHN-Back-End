import { Request, Response, NextFunction } from "express";
import { getCurrentShopMembershipService } from "@/service/shop/membership.service";
import { sendSuccess } from "@/utils/apiResponse";

export const getCurrentShopMembershipController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const membership = await getCurrentShopMembershipService(
      req.params.shopSlug as string,
      req.user!.userId,
    );
    return sendSuccess(res, membership);
  } catch (error) {
    next(error);
  }
};
