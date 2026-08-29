"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVerifyToken = exports.findVerifyToken = exports.createVerifyToken = exports.updateRefreshToken = exports.createUser = exports.findUserByEmail = exports.findUserById = void 0;
const prisma_1 = require("@/db/prisma");
const findUserById = (id) => {
    return prisma_1.db.user.findUnique({
        where: { id },
    });
};
exports.findUserById = findUserById;
const findUserByEmail = async (email) => {
    return prisma_1.db.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            password: true,
            role: true,
            // nếu login cần
        },
    });
};
exports.findUserByEmail = findUserByEmail;
const createUser = (data) => {
    return prisma_1.db.user.create({ data });
};
exports.createUser = createUser;
const updateRefreshToken = (userId, refreshToken) => {
    return prisma_1.db.user.update({
        where: { id: userId },
        data: { refreshToken },
    });
};
exports.updateRefreshToken = updateRefreshToken;
const createVerifyToken = (userId, token, expiresAt) => {
    return prisma_1.db.emailVerificationToken.create({
        data: {
            userId,
            token,
            expiresAt, // đúng tên field
        },
    });
};
exports.createVerifyToken = createVerifyToken;
const findVerifyToken = async (token) => {
    return prisma_1.db.emailVerificationToken.findUnique({
        where: { token },
    });
};
exports.findVerifyToken = findVerifyToken;
const deleteVerifyToken = async (token) => {
    return prisma_1.db.emailVerificationToken.delete({
        where: { token },
    });
};
exports.deleteVerifyToken = deleteVerifyToken;
