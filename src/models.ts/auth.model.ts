import { db } from '@/db/prisma';
import { UserEntity } from '@/validates/auth.validate';
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
      password: true,
      role: true,
      // nếu login cần
    },
  });
};
export const createUser = (data: Pick<UserEntity, 'email' | 'password'>) => {
  return db.user.create({ data });
};
export const updateRefreshToken = (
  userId: string,
  refreshToken: string | null
) => {
  return db.user.update({
    where: { id: userId },
    data: { refreshToken },
  });
};
export const createVerifyToken = (
  userId: string,
  token: string,
  expiresAt: Date
) => {
  return db.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt, // đúng tên field
    },
  });
};

export const findVerifyToken = async (token: string) => {
  return db.emailVerificationToken.findUnique({
    where: { token },
  });
};
export const deleteVerifyToken = async (token: string) => {
  return db.emailVerificationToken.delete({
    where: { token },
  });
};
