import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import authRoutes from './route/auth.route';
import cookieParser from 'cookie-parser';
import shopRouter from './route/shop/shop.route';
import serviceRouter from './route/service/service.route';
import { createDailyAttendance } from './jobs/attendance.job';
const app = express();
app.use(cookieParser());

app.use(helmet());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_session_secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use('/auth', authRoutes);
app.use('/api/shops', shopRouter);
app.get('/test/cron', async (req, res) => {
  await createDailyAttendance();
  res.json({ success: true });
});
export default app;
