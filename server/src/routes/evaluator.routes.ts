import { Router } from 'express';
import { EVALUATION_LANGUAGES, reviewProjectCode } from '../controllers/evaluator.controller';
import { authenticate } from '../middleware/auth';
import { rateLimit, byUserOrIp } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import { env } from '../config/env';

const router = Router();

const aiHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.aiRateLimitPerHour,
  keyPrefix: 'review-hour',
  key: byUserOrIp,
  message: 'You have reached the hourly AI request limit. Please try again later.',
});

const aiDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: env.aiRateLimitPerDay,
  keyPrefix: 'review-day',
  key: byUserOrIp,
  message: 'You have reached the daily AI request limit. Please try again tomorrow.',
});

router.post(
  '/review',
  authenticate,
  aiHourlyLimiter,
  aiDailyLimiter,
  validateBody({
    projectId: { type: 'string', required: true, min: 6, max: 64 },
    codeSnippet: { type: 'string', required: true, min: 1, max: 20000 },
    taskDescription: { type: 'string', max: 500 },
    language: { type: 'enum', values: EVALUATION_LANGUAGES },
  }),
  reviewProjectCode
);

export default router;
