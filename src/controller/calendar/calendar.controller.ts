import { Request, Response, NextFunction } from "express";
import {
  getAvailableSlots,
  getAllSlots,
  getTimeSlots,
  getAppointmentsWithSlots,
  getMonthAvailability,
} from "@/service/calendar/calendar.service";
import { sendSuccess } from "@/utils/apiResponse";

export const getAvailableSlotsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const { date, durationMin, staffId } = req.query as unknown as { date: string; durationMin: number; staffId?: string };
    const slots = await getAvailableSlots({ shopSlug, date, durationMin, staffId });
    sendSuccess(res, slots);
  } catch (error) {
    next(error);
  }
};

export const getAllSlotsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const { date, durationMin } = req.query as unknown as { date: string; durationMin: number };
    const slots = await getAllSlots(shopSlug, date, durationMin);
    sendSuccess(res, slots);
  } catch (error) {
    next(error);
  }
};

export const getTimeSlotsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const { date } = req.query as unknown as { date: string };
    const slots = await getTimeSlots(shopSlug, date);
    sendSuccess(res, slots);
  } catch (error) {
    next(error);
  }
};

export const getAppointmentsWithSlotsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const { date } = req.query as unknown as { date: string };
    const data = await getAppointmentsWithSlots(shopSlug, date);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getMonthAvailabilityController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const { year, month, staffId } = req.query as unknown as { year: number; month: number; staffId?: string };
    const availability = await getMonthAvailability(shopSlug, year, month, staffId);
    sendSuccess(res, availability);
  } catch (error) {
    next(error);
  }
};
