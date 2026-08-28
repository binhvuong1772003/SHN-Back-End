import { Request, Response, NextFunction } from "express";
import { getTopCustomer } from "@/service/customer/customer.service";
export const getTopCustomerController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const limit = parseInt(req.query.limit as string) || 5;
    const customers = await getTopCustomer(shopSlug, limit);
    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};
