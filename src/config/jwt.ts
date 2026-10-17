import { Secret } from 'jsonwebtoken';

export const jwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET as Secret,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET as Secret,

  accessTokenExpiresIn: '7d',
  refreshTokenExpiresIn: '7d',
};
