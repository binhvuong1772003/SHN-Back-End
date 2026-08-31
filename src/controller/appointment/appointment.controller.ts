import { Request, Response, NextFunction } from "express";
import {
  createAppointment,
  getAppointmentsByShopId,
  getAppointmentsByDay,
  changeAppointmentStatus,
  getAppointmentLifecycle,
  markAllAppointmentsAsDone,
  getIncomeByDayWeekly,
} from "@/service/appointment/appointment.service";
import { CreateAppointmentInput } from "@/validation/appointment";
import { sendSuccess } from "@/utils/apiResponse";

export const createAppointmentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const customerId = req.user?.userId as string;
    const input = req.body as CreateAppointmentInput;
    const appointment = await createAppointment(input, customerId, shopSlug);
    sendSuccess(res, appointment, { statusCode: 201, message: "Appointment created successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentsByShopIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointments = await getAppointmentsByShopId(req.params.shopSlug as string);
    sendSuccess(res, appointments);
  } catch (error) {
    next(error);
  }
};

export const getAppointmentsByDayController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopSlug = req.params.shopSlug as string;
    const dateStr = req.query.date as string;
    const appointments = await getAppointmentsByDay(
      shopSlug,
      dateStr,
      req.query.assignedToMe === "true" ? req.user?.userId : undefined,
    );
    sendSuccess(res, appointments);
  } catch (error) {
    next(error);
  }
};

export const changeAppointmentStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await changeAppointmentStatus(
      req.params.shopSlug as string,
      req.params.appointmentId as string,
      req.body.status as string,
      req.user?.userId as string,
      req.shopStaff?.role,
      req.body.reason as string | undefined,
      req.body.cancelReason as string | undefined,
      req.body.internalNote as string | undefined,
    );
    sendSuccess(res, appointment);
  } catch (error) {
    next(error);
  }
};

export const getAppointmentLifecycleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const lifecycle = await getAppointmentLifecycle(
      req.params.shopSlug as string,
      req.params.appointmentId as string,
    );
    sendSuccess(res, lifecycle);
  } catch (error) {
    next(error);
  }
};

export const markAllAppointmentsAsDoneController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await markAllAppointmentsAsDone(
      req.params.shopSlug as string,
      req.user?.userId as string,
      req.shopStaff?.role,
    );
    sendSuccess(res, result, { message: "All appointments marked as completed" });
  } catch (error) {
    next(error);
  }
};

export const getIncomeByDayWeeklyController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const income = await getIncomeByDayWeekly(req.params.shopSlug as string);
    sendSuccess(res, income);
  } catch (error) {
    next(error);
  }
};
