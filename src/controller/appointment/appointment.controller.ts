import { Request, Response, NextFunction } from 'express';
import {
  createAppointment,
  getAppointmentsByShopId,
  getAppointmentsByDay,
  changeAppointmentStatus,
} from '@/service/appointment/appointment.service';
import { CreateAppointmentInput } from '@/validation/appointment';
import dayjs from 'dayjs';

export const createAppointmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const customerId = req.user?.userId as string;
    const input = req.body as CreateAppointmentInput;

    const appointment = await createAppointment(input, customerId, shopSlug);

    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Đặt lịch thành công',
    });
  } catch (error) {
    next(error);
  }
};
export const getAppointmentsByShopIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const appointments = await getAppointmentsByShopId(shopSlug);
    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};
export const getAppointmentsByDayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const dateStr = req.query.date as string;
    const date = dayjs(dateStr).startOf('day').toDate();
    const appointments = await getAppointmentsByDay(shopSlug, date);
    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};
export const changeAppointmentStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const appointmentId = req.params.appointmentId as string;
    const status = req.body.status as string;
    const appointment = await changeAppointmentStatus(
      shopSlug,
      appointmentId,
      status
    );
    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};
