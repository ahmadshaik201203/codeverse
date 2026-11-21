import { Router } from 'express';
import { getSkillRadar, getAnalyticsSummary } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/radar', authenticate as any, getSkillRadar as any);
router.get('/summary', authenticate as any, getAnalyticsSummary as any);

export default router;
