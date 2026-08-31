"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("@/utils/jwt");
const ApiError_1 = require("@/utils/ApiError");
const prisma_1 = require("@/db/prisma");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ApiError_1.ApiError(401, 'Unauthorized'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        const user = await prisma_1.db.user.findUnique({
            where: { id: payload.userId },
            select: { tokenVersion: true, isActive: true },
        });
        if (!user || !user.isActive || payload.tokenVersion !== user.tokenVersion) {
            return next(new ApiError_1.ApiError(401, 'Session has been revoked'));
        }
        req.user = payload;
        next();
    }
    catch {
        return next(new ApiError_1.ApiError(401, 'Token is invalid or has expired'));
    }
};
exports.authenticate = authenticate;
