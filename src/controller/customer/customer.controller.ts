import { Request, Response, NextFunction } from "express";
import { getCustomerDetail, getCustomerList, getTopCustomer } from "@/service/customer/customer.service";
import { sendSuccess } from "@/utils/apiResponse";
export const getTopCustomerController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const limit = Number(req.query.limit ?? 5);
    const customers = await getTopCustomer(shopSlug, limit);
    sendSuccess(res, customers);
  } catch (error) {
    next(error);
  }
};

export const getCustomerListController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getCustomerList(req.params.shopSlug as string, req.query as any);
    sendSuccess(res, result.items, { meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDetailController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getCustomerDetail(req.params.shopSlug as string, req.params.customerId as string);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
