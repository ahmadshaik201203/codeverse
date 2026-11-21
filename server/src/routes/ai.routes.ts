import { Router } from 'express';
import {
  generateProjectBlueprint,
  getSavedProjectBlueprint,
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';
import { rateLimit, byUserOrIp } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import { env } from '../config/env';

const router = Router();

/**
 * AI calls cost money, so both an hourly and a daily ceiling are enforced per
 * authenticated user (IP fallback for safety).
 */
const aiHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.aiRateLimitPerHour,
  keyPrefix: 'ai-hour',
  key: byUserOrIp,
  message: 'You have reached the hourly AI request limit. Please try again later.',
});

const aiDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: env.aiRateLimitPerDay,
  keyPrefix: 'ai-day',
  key: byUserOrIp,
  message: 'You have reached the daily AI request limit. Please try again tomorrow.',
});

router.post(
  '/project-blueprint',
  authenticate,
  aiHourlyLimiter,
  aiDailyLimiter,
  validateBody({
    projectId: { type: 'string', required: true, min: 6, max: 64 },
  }),
  generateProjectBlueprint
);

// Reading a saved blueprint is a database lookup, so it is not rate-limited.
router.get('/project-blueprint/:projectId', authenticate, getSavedProjectBlueprint);

export default router;
