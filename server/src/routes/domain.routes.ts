import { Router } from 'express';
import { getAllDomains, getDomainBySlug } from '../controllers/domain.controller';
import { getProjectsByDomain } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Routes are protected to ensure only authenticated users can browse platform domains
router.get('/', authenticate, getAllDomains);
router.get('/:slug', authenticate, getDomainBySlug);
router.get('/:slug/projects', authenticate, getProjectsByDomain);

export default router;
