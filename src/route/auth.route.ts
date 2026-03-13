import { Router } from 'express';
import {
  googleLoginController,
  googleCallbackController,
  googleLogoutController,
} from '@/controller/googleOauth.controller';
import {
  registerWithEmailController,
  loginWithEmailController,
  logoutController,
  getMeController,
  refresthTokenController,
  verifyEmailController,
  reSendEmailVerifyController,
} from '@/controller/auth.controller';
import { authenticate } from '@/middleware/authenticate.middleware';
import { validate } from '@/middleware/validation.middleware';
import { registerSchema } from '@/validation/auth.validate';
// import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

router.get('/google', googleLoginController);
router.get('/google/callback', googleCallbackController);
router.post('/register', validate(registerSchema), registerWithEmailController);
router.post('/login', loginWithEmailController);
router.post('/logout', logoutController);
router.get('/me', authenticate, getMeController);
router.post('/token/refresh', refresthTokenController);
router.post('/email/verify', verifyEmailController);
router.post('/email/verification/resend', reSendEmailVerifyController);

// router.post('/google/logout', authenticate, googleLogoutController);

export default router;
