"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("@/utils/jwt");
const ApiError_1 = require("@/utils/ApiError");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ApiError_1.ApiError(401, 'Unauthorized'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch {
        return next(new ApiError_1.ApiError(401, 'Token không hợp lệ hoặc đã hết hạn'));
    }
};
exports.authenticate = authenticate;
