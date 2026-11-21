import { Router } from 'express';
import { getLeaderboard, awardXp, getGamificationStats } from '../controllers/gamification.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

// Leaderboard is only meaningful to signed-in students.
router.get('/leaderboard', authenticate, getLeaderboard as never);
router.get('/stats', authenticate, getGamificationStats as never);

/**
 * SEC-06: XP may not be claimed by the client. There is no server-side proof of
 * work behind this endpoint yet, so it is restricted to administrators until the
 * XpEvent ledger lands (Phase 7). Ordinary users can no longer mint XP.
 */
router.post(
  '/award-xp',
  authenticate,
  requireRole('admin'),
  validateBody({
    actionType: {
      type: 'enum',
      required: true,
      values: ['task_verified', 'code_review', 'sandbox_run', 'blueprint_view'],
    },
    // Optional idempotency key: replaying it returns the existing balance.
    dedupeKey: { type: 'string', max: 80 },
  }),
  awardXp as never
);

export default router;
