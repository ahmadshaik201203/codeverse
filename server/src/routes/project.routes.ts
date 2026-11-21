import { Router } from 'express';
import { getAllProjects, getProjectByIdOrSlug } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Allow authenticated students to discover projects
router.get('/', authenticate, getAllProjects);
router.get('/:id', authenticate, getProjectByIdOrSlug);

export default router;
