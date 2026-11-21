import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Domain } from '../models/Domain';
import { Project } from '../models/Project';
import { CommunityPost } from '../models/CommunityPost';

/**
 * Platform overview built only from real collections — no invented statistics.
 * Access is enforced by requireRole('admin') on the route, not by the UI.
 */
export const getOverview = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [users, domains, projects, posts] = await Promise.all([
      User.countDocuments(),
      Domain.countDocuments(),
      Project.countDocuments(),
      CommunityPost.countDocuments(),
    ]);

    res.json({
      overview: {
        users,
        domains,
        projects,
        posts,
      },
    });
  } catch (error) {
    next(error);
  }
};
