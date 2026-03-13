import { Request, Response, NextFunction } from 'express';
import { CreateShopInput } from '@/validation/shop.validate';
import {
  createShopService,
  updateShopService,
  uploadShopLogoService,
  getListShopService,
  uploadShopBannerService,
} from '@/service/shop/shop.service';
import { CLOUDINARY_FOLDERS } from '@/utils/cloudinary';
export const createShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body as CreateShopInput;
    const ownerId = req.user?.userId as string;
    const shop = await createShopService(input, ownerId);
    res.status(201).json({ success: true, data: shop });
  } catch (error) {
    next(error);
  }
};
export const getListShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user?.userId as string;
    const shops = await getListShopService(ownerId);
    res.status(200).json({ success: true, data: shops });
  } catch (error) {
    next(error);
  }
};
export const getShopDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    res.status(200).json({ success: true, data: req.shop });
  } catch (error) {
    next(error);
  }
};
export const updateShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shop = await updateShopService(
      req.params.shopSlug as string,
      req.body
    );
    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    next(error);
  }
};
export const uploadShopLogoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shop = await uploadShopLogoService(
      req.file as Express.Multer.File,
      CLOUDINARY_FOLDERS.SHOP_LOGO,
      req.params.shopSlug as string
    );
    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    next(error);
  }
};
export const uploadShopBannerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shop = await uploadShopBannerService(
      req.file as Express.Multer.File,
      CLOUDINARY_FOLDERS.SHOP_COVER,
      req.params.shopSlug as string
    );
    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    next(error);
  }
};
