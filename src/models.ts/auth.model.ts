import { db } from "@/db/prisma";

export const findUserById = (id: string) => {
  return db.user.findUnique({
    where: { id },
  });
};

export const findUserByEmail = async (email: string) => {
  return db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
    },
  });
};

export const createUser = (data: {
  name: string;
  email: string;
  passwordHash?: string;
}) => {
  return db.user.create({ data });
};

export const updateRefreshToken = (
  userId: string,
  refreshToken: string | null,
) => {
  return db.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: refreshToken === null },
  });
};

export const createVerifyToken = (
  userId: string,
  token: string,
  expiresAt: Date,
) => {
  return db.emailVerification.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
};

export const findVerifyToken = async (token: string) => {
  return db.emailVerification.findUnique({
    where: { token },
  });
};

export const deleteVerifyToken = async (token: string) => {
  return db.emailVerification.delete({
    where: { token },
  });
};
