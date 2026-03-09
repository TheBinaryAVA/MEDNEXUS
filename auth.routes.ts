import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authValidators } from '../middleware/validators';
import { config } from '../config';

const router = Router();

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post('/register', authLimiter, validate(authValidators.register), authController.register.bind(authController));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login and receive tokens
 *     tags: [Auth]
 */
router.post('/login', authLimiter, validate(authValidators.login), authController.login.bind(authController));

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using cookie
 *     tags: [Auth]
 */
router.post('/refresh', authController.refresh.bind(authController));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authenticate, authController.logout.bind(authController));

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
