import { Request, Response, NextFunction } from "express";
import {
  getAvailableSlots,
  getAllSlots,
  getTimeSlots,
  getAppointmentsWithSlots,
  getMonthAvailability,
} from "@/service/calendar/calendar.service";

export const getAvailableSlotsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const { date, durationMin, staffId } = req.query as {
      [key: string]: string;
    };

    if (
      !date ||
      !durationMin ||
      typeof date !== "string" ||
      typeof durationMin !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "date và durationMin là bắt buộc và phải là string",
      });
    }

    const slots = await getAvailableSlots({
      shopSlug,
      date,
      durationMin: parseInt(durationMin),
      staffId: staffId || undefined,
    });

    res.status(200).json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

export const getAllSlotsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const { date, durationMin } = req.query as {
      [key: string]: string;
    };

    if (
      !date ||
      !durationMin ||
      typeof date !== "string" ||
      typeof durationMin !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "date và durationMin là bắt buộc và phải là string",
      });
    }

    const slots = await getAllSlots(shopSlug, date, parseInt(durationMin));

    res.status(200).json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

export const getTimeSlotsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const { date } = req.query as {
      [key: string]: string;
    };

    if (!date || typeof date !== "string") {
      return res.status(400).json({
        success: false,
        message: "date là bắt buộc và phải là string",
      });
    }

    const slots = await getTimeSlots(shopSlug, date);

    res.status(200).json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentsWithSlotsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const { date } = req.query as {
      [key: string]: string;
    };

    if (!date || typeof date !== "string") {
      return res.status(400).json({
        success: false,
        message: "date là bắt buộc và phải là string",
      });
    }

    const data = await getAppointmentsWithSlots(shopSlug, date);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMonthAvailabilityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const { year, month, staffId } = req.query as { [key: string]: string };

    if (
      !year ||
      !month ||
      typeof year !== "string" ||
      typeof month !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "year và month là bắt buộc và phải là string",
      });
    }

    const availability = await getMonthAvailability(
      shopSlug,
      parseInt(year),
      parseInt(month),
      typeof staffId === "string" ? staffId : undefined,
    );

    res.status(200).json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
};
