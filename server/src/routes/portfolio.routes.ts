import { Router } from 'express';
import { getPublicPortfolio, getMyPortfolio, updateMyPortfolio } from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate as any, getMyPortfolio as any);
router.put('/me', authenticate as any, updateMyPortfolio as any);
router.get('/:identifier', getPublicPortfolio as any);

export default router;
