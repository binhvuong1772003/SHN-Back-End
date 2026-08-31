import { Request, Response, NextFunction } from "express";
import { getTopCustomer } from "@/service/customer/customer.service";
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
