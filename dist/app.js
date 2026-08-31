"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importDefault(require("express-session"));
const auth_route_1 = __importDefault(require("./route/auth.route"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const shop_route_1 = __importDefault(require("./route/shop/shop.route"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const error_middleware_1 = require("./middleware/error.middleware");
const metrics_route_1 = __importDefault(require("./route/metrics.route"));
const metrics_middleware_1 = require("./middleware/metrics.middleware");
const sentry_1 = require("./observability/sentry");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const app = (0, express_1.default)();
(0, sentry_1.initSentry)();
app.use((0, cookie_parser_1.default)());
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(metrics_middleware_1.metricsMiddleware);
app.use(metrics_route_1.default);
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "dev_session_secret",
    resave: false,
    saveUninitialized: false,
}));
app.use("/auth", auth_route_1.default);
app.use("/api/shops", shop_route_1.default);
(0, sentry_1.setupSentryExpress)(app);
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
exports.default = app;
