import { Request, Response, NextFunction } from 'express';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from '@/service/service/category.service';
import { sendSuccess } from '@/utils/apiResponse';
export const createCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const shopSlug = req.params.shopSlug as string;
    const result = await createCategory(data, shopSlug);
    sendSuccess(res, result, { statusCode: 201 });
  } catch (error) {
    next(error);
  }
};
export const deleteCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const result = await deleteCategory(id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
export const getCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const result = await getCategories(shopSlug);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
export const getCategoryByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const result = await getCategoryById(id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
export const updateCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    const result = await updateCategory(id, data);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
