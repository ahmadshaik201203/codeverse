import { Router } from 'express';
import { register, login, getMe, onboard, googleAuth } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import { env } from '../config/env';

const router = Router();

const YEAR_VALUES = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'] as const;
const LANGUAGE_VALUES = [
  'English',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Telugu',
  'Tamil',
  'Bengali',
] as const;

/** Broad per-IP ceiling so rotating emails cannot bypass the credential limiter. */
const authIpLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMaxAttempts * 6,
  keyPrefix: 'auth-ip',
  message: 'Too many authentication attempts from this address. Please try again later.',
});

/** Per IP + email ceiling: the actual brute-force guard. */
const credentialLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMaxAttempts,
  keyPrefix: 'auth-cred',
  key: (req) => {
    const body = (req.body ?? {}) as { email?: unknown };
    const email = typeof body.email === 'string' ? body.email.toLowerCase().slice(0, 160) : 'anonymous';
    return `${req.ip ?? 'unknown'}|${email}`;
  },
  message: 'Too many attempts for this account. Please wait and try again.',
});

const providerLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: 10,
  keyPrefix: 'auth-provider',
  message: 'Too many sign-in attempts. Please wait and try again.',
});

router.post(
  '/register',
  authIpLimiter,
  credentialLimiter,
  validateBody({
    fullName: { type: 'string', required: true, min: 2, max: 120 },
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, min: 12, max: 128 },
    college: { type: 'string', required: true, min: 2, max: 160 },
    department: { type: 'string', required: true, min: 2, max: 120 },
    year: { type: 'enum', required: true, values: YEAR_VALUES },
    preferredLanguage: { type: 'enum', values: LANGUAGE_VALUES },
  }),
  register
);

router.post(
  '/login',
  authIpLimiter,
  credentialLimiter,
  validateBody({
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, min: 1, max: 128 },
  }),
  login
);

router.post(
  '/google',
  authIpLimiter,
  providerLimiter,
  validateBody({
    idToken: { type: 'string', required: true, min: 20, max: 4096 },
  }),
  googleAuth
);

router.get('/me', authenticate, getMe);

router.post(
  '/onboard',
  authenticate,
  validateBody({
    careerGoal: { type: 'string', required: true, min: 2, max: 120 },
    experienceLevel: {
      type: 'enum',
      required: true,
      values: ['Beginner', 'Intermediate', 'Advanced'],
    },
    knownTechnologies: { type: 'stringArray', maxItems: 40, max: 60 },
    learningLanguage: { type: 'enum', values: LANGUAGE_VALUES },
  }),
  onboard
);

export default router;
