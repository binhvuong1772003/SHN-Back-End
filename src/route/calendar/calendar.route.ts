import { Router } from 'express';
import {
  getAvailableSlotsController,
  getMonthAvailabilityController,
} from '@/controller/calendar/calendar.controller';

const calendarRouter = Router({ mergeParams: true });

calendarRouter.get('/slots', getAvailableSlotsController);
calendarRouter.get('/month', getMonthAvailabilityController);

export default calendarRouter;
