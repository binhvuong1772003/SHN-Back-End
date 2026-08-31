"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSentryExpress = exports.initSentry = void 0;
const Sentry = __importStar(require("@sentry/node"));
let initialized = false;
const numberFromEnv = (name, fallback) => {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
};
const initSentry = () => {
    if (initialized)
        return;
    const dsn = process.env.SENTRY_DSN?.trim();
    if (!dsn) {
        return;
    }
    try {
        Sentry.init({
            dsn,
            environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
            tracesSampleRate: numberFromEnv("SENTRY_TRACES_SAMPLE_RATE", 0),
            sendDefaultPii: false,
        });
        initialized = true;
    }
    catch (error) {
        // Observability must never prevent the API from starting.
        console.error("Sentry initialization failed", error);
    }
};
exports.initSentry = initSentry;
const setupSentryExpress = (app) => {
    if (initialized) {
        Sentry.setupExpressErrorHandler(app);
    }
};
exports.setupSentryExpress = setupSentryExpress;
