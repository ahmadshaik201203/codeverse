import { Router } from 'express';
import { getPosts, createPost, addReply, upvotePost } from '../controllers/community.controller';
import { authenticate } from '../middleware/auth';
import { rateLimit, byUserOrIp } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';

const router = Router();

/** Anti-spam ceiling: community writes award XP, so they must be bounded. */
const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyPrefix: 'community-write',
  key: byUserOrIp,
  message: 'You are posting too frequently. Please wait before contributing again.',
});

router.get('/posts', getPosts as never);

router.post(
  '/posts',
  authenticate,
  writeLimiter,
  validateBody({
    title: { type: 'string', required: true, min: 3, max: 160 },
    content: { type: 'string', required: true, min: 10, max: 5000 },
    tags: { type: 'stringArray', maxItems: 8, max: 30 },
    domainSlug: { type: 'string', max: 60 },
  }),
  createPost as never
);

router.post(
  '/posts/:id/replies',
  authenticate,
  writeLimiter,
  validateBody({
    content: { type: 'string', required: true, min: 1, max: 2000 },
  }),
  addReply as never
);

router.post('/posts/:id/upvote', authenticate, upvotePost as never);

export default router;
