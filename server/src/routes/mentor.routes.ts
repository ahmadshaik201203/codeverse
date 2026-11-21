import { Router } from 'express';
import { askMentor, verifyTask } from '../controllers/mentor.controller';
import { authenticate } from '../middleware/auth';
import { rateLimit, byUserOrIp } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import { env } from '../config/env';
import { MENTOR_MODES } from '../services/mentorModes';

const router = Router();

const aiHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.aiRateLimitPerHour,
  keyPrefix: 'mentor-hour',
  key: byUserOrIp,
  message: 'You have reached the hourly AI request limit. Please try again later.',
});

const aiDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: env.aiRateLimitPerDay,
  keyPrefix: 'mentor-day',
  key: byUserOrIp,
  message: 'You have reached the daily AI request limit. Please try again tomorrow.',
});

router.post(
  '/ask',
  authenticate,
  aiHourlyLimiter,
  aiDailyLimiter,
  validateBody({
    projectId: { type: 'string', min: 6, max: 64 },
    taskContext: { type: 'string', max: 300 },
    codeSnippet: { type: 'string', max: 20000 },
    userMessage: { type: 'string', required: true, min: 1, max: 4000 },
    mode: { type: 'enum', values: MENTOR_MODES },
    history: { type: 'chatHistory', maxItems: 20, max: 4000 },
  }),
  askMentor
);

router.post(
  '/verify',
  authenticate,
  aiHourlyLimiter,
  aiDailyLimiter,
  validateBody({
    projectId: { type: 'string', required: true, min: 6, max: 64 },
    taskDescription: { type: 'string', required: true, min: 3, max: 500 },
    codeSnippet: { type: 'string', required: true, min: 1, max: 20000 },
  }),
  verifyTask
);

export default router;
