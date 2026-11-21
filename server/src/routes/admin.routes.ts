import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getOverview } from '../controllers/admin.controller';

const router = Router();

/**
 * Every admin endpoint is gated server-side. Hiding a button in the client is
 * never sufficient authorization.
 */
router.get('/overview', authenticate, requireRole('admin', 'faculty'), getOverview);

export default router;
