import { Request, Response, NextFunction } from "express";
import {
  CreateShopInput,
  BusinessHoursInput,
} from "@/validation/shop.validate";
import {
  createShopService,
  updateShopService,
  uploadShopLogoService,
  getListShopService,
  uploadShopBannerService,
  getBusinessHoursService,
  updateBusinessHoursService,
} from "@/service/shop/shop.service";
import { CLOUDINARY_FOLDERS } from "@/utils/cloudinary";
import { sendSuccess } from "@/utils/apiResponse";
export const createShopController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = req.body as CreateShopInput;
    const ownerId = req.user?.userId as string;
    const shop = await createShopService(input, ownerId);
    sendSuccess(res, shop, { statusCode: 201 });
  } catch (error) {
    next(error);
  }
};
export const getListShopController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const ownerId = req.user?.userId as string;
    const shops = await getListShopService(ownerId);
    sendSuccess(res, shops);
  } catch (error) {
    next(error);
  }
};
export const getShopDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    sendSuccess(res, req.shop);
  } catch (error) {
    next(error);
  }
};
export const updateShopController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    const shop = await updateShopService(
      req.params.shopSlug as string,
      req.body,
    );
    sendSuccess(res, shop);
  } catch (error) {
    next(error);
  }
};
export const uploadShopLogoController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shop = await uploadShopLogoService(
      req.file as Express.Multer.File,
      CLOUDINARY_FOLDERS.SHOP_LOGO,
      req.params.shopSlug as string,
    );
    sendSuccess(res, shop);
  } catch (error) {
    next(error);
  }
};
export const uploadShopBannerController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shop = await uploadShopBannerService(
      req.file as Express.Multer.File,
      CLOUDINARY_FOLDERS.SHOP_COVER,
      req.params.shopSlug as string,
    );
    sendSuccess(res, shop);
  } catch (error) {
    next(error);
  }
};
export const getBusinessHoursController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessHours = await getBusinessHoursService(
      req.params.shopSlug as string,
    );
    sendSuccess(res, businessHours);
  } catch (error) {
    next(error);
  }
};
export const updateBusinessHoursController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessHours = await updateBusinessHoursService(
      req.params.shopSlug as string,
      req.body as BusinessHoursInput,
    );
    sendSuccess(res, businessHours);
  } catch (error) {
    next(error);
  }
};
