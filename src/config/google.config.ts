const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:3000/auth/google/callback',

  // Endpoints
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  revokeUrl: 'https://oauth2.googleapis.com/revoke',

  // Scopes
  scopes: ['openid', 'profile', 'email'],
};

export default googleConfig;
