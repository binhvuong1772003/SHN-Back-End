import googleConfig from '@/config/google.config';
import { ApiError } from '@/utils/ApiError';
import axios from 'axios';
import crypto from 'crypto';
import { db } from '@/db/prisma';
import { OAuthProvider } from '@prisma/client';
import { issueTokens } from './auth.service';
import type { AuthTokens } from './auth.service';
interface GoogleToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
}
interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}
export const generateGoogleUrlService = (state: string): string => {
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });
  return `${googleConfig.authUrl}?${params.toString()}`;
};
export const generateOAuthStateService = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
export const exchangeCodeForGoogleTokenService = async (
  code: string
): Promise<GoogleToken> => {
  try {
    const { data } = await axios.post(
      googleConfig.tokenUrl,
      new URLSearchParams({
        code,
        client_id: googleConfig.clientId,
        client_secret: googleConfig.clientSecret,
        redirect_uri: googleConfig.redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
      id_token: data.id_token,
    };
  } catch (err) {
    throw new ApiError(400, 'Failed to exchange code for Google token');
  }
};
export const getGoogleUserInfo = async (
  accessToken: string
): Promise<GoogleUserInfo> => {
  try {
    const { data } = await axios.get(googleConfig.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } catch (err) {
    throw new ApiError(400, 'Failed to get Google user info');
  }
};
export const upsertGoogleAccountService = async (
  googleUser: GoogleUserInfo,
  googleToken: GoogleToken
) => {
  const expireAt = new Date(Date.now() + googleToken.expires_in * 1000);
  const existingOauth = await db.oAuthAccount.findUnique({
    where: {
      provider_providerId: {
        provider: OAuthProvider.GOOGLE,
        providerId: googleUser.id,
      },
    },
    include: {
      user: true,
    },
  });
  if (existingOauth) {
    await db.oAuthAccount.update({
      where: {
        id: existingOauth.id,
      },
      data: {
        accessToken: googleToken.access_token,
        refreshToken: googleToken.refresh_token,
        expiresAt: expireAt,
      },
    });
    return existingOauth.user;
  }
  const user = await db.user.findUnique({
    where: {
      email: googleUser.email,
    },
  });
  if (user) {
    await db.oAuthAccount.create({
      data: {
        provider: OAuthProvider.GOOGLE,
        providerId: googleUser.id,
        userId: user.id,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        accessToken: googleToken.access_token,
        refreshToken: googleToken.refresh_token,
        expiresAt: expireAt,
      },
    });
    return db.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
      },
    });
  }
  return await db.user.create({
    data: {
      name: googleUser.name,
      email: googleUser.email,
      avatarUrl: googleUser.picture,
      isActive: true,
      isVerified: true,
      role: 'CUSTOMER',
      oauthAccounts: {
        create: {
          provider: OAuthProvider.GOOGLE,
          providerId: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture,
          accessToken: googleToken.access_token,
          refreshToken: googleToken.refresh_token,
          expiresAt: expireAt,
        },
      },
    },
  });
};
export const handleGoogleCallbackService = async (
  code: string,
  meta: { deviceInfo?: string; ipAddress?: string }
): Promise<{ user: object; tokens: AuthTokens }> => {
  const googleToken = await exchangeCodeForGoogleTokenService(code);
  const googleUser = await getGoogleUserInfo(googleToken.access_token);
  const user = await upsertGoogleAccountService(googleUser, googleToken);
  if (!user) {
    throw new ApiError(400, 'Failed to create user');
  }
  const tokens = await issueTokens(user.id, user.role, meta);
  const { passwordHash, ...safeUser } = user as any;
  return { user: safeUser, tokens };
};
export const revokeGoogleToken = async (userId: string): Promise<void> => {
  const oauthAccount = await db.oAuthAccount.findFirst({
    where: { userId, provider: OAuthProvider.GOOGLE },
  });
  if (!oauthAccount) throw new ApiError(404, 'Google account not found');
  try {
    if (oauthAccount.accessToken) {
      await axios.post(
        googleConfig.revokeUrl,
        new URLSearchParams({ token: oauthAccount.accessToken }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
    }
  } catch (err) {
    console.log(err);
  }
  await db.oAuthAccount.update({
    where: {
      id: oauthAccount.id,
    },
    data: {
      refreshToken: null,
      accessToken: null,
      expiresAt: null,
    },
  });
};
