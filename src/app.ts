import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import authRoutes from "./route/auth.route";
import cookieParser from "cookie-parser";
import shopRouter from "./route/shop/shop.route";
import serviceRouter from "./route/service/service.route";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import metricsRouter from "./route/metrics.route";
import { metricsMiddleware } from "./middleware/metrics.middleware";
import { initSentry, setupSentryExpress } from "./observability/sentry";
dayjs.extend(utc);
dayjs.extend(timezone);
const app = express();
initSentry();
app.use(cookieParser());

app.use(helmet());
const configuredOrigins =
  process.env.CORS_ORIGINS ??
  (process.env.NODE_ENV === "production"
    ? (process.env.FRONTEND_URL ?? "")
    : "http://localhost:5173");

const allowedOrigins = new Set(
  configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép curl, Prometheus và server-to-server request
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(express.json());
app.use(metricsMiddleware);
app.use(metricsRouter);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_session_secret",
    resave: false,
    saveUninitialized: false,
  }),
);
app.use("/auth", authRoutes);
app.use("/api/shops", shopRouter);
setupSentryExpress(app);
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
