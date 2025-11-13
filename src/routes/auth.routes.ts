import { Router } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({
      status: 'success',
      data: result,
    });
  })
);

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json({
      status: 'success',
      data: result,
    });
  })
);

/**
 * GET /api/v1/auth/profile
 * Get current user profile (protected)
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user!.userId);
    res.json({
      status: 'success',
      data: profile,
    });
  })
);

export default router;
