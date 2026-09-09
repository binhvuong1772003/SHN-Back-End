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
  updateProfileController,
  updateProfileAvatarController,
} from '@/controller/auth.controller';
import { authenticate } from '@/middleware/authenticate.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
  emailVerificationQuerySchema,
  updateProfileSchema,
} from '@/validation/auth.validate';
import { upload } from '@/middleware/upload.middleware';
// import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

router.get('/google', googleLoginController);
router.get('/google/callback', googleCallbackController);
router.post('/register', validate(registerSchema), registerWithEmailController);
router.post('/login', validate(loginSchema), loginWithEmailController);
router.post('/logout', logoutController);
router.get('/me', authenticate, getMeController);
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfileController);
router.patch('/me/avatar', authenticate, upload.single('avatar'), updateProfileAvatarController);
router.post('/token/refresh', refresthTokenController);
router.post('/email/verify', validate(emailVerificationQuerySchema), verifyEmailController);
router.post('/email/verification/resend', validate(resendVerificationSchema), reSendEmailVerifyController);

// router.post('/google/logout', authenticate, googleLogoutController);

export default router;
