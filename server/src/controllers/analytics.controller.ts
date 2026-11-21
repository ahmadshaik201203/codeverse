import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { AppError } from '../middleware/error';

/**
 * Skill radar built only from skills the user actually has.
 * An account with no verified skills returns an empty list.
 */
export const getSkillRadar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('skills');
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    const skills = (user.skills ?? []).map((skill) => ({
      subject: skill.name,
      score: Math.max(0, Math.min(100, skill.score)),
      fullMark: 100,
    }));

    res.json({ skills });
  } catch (error) {
    next(error);
  }
};

/**
 * Analytics summary.
 *
 * Every number here comes from the database. Time-invested and per-day commit
 * history have no backing data model yet, so they are not returned at all
 * rather than being estimated or invented.
 */
export const getAnalyticsSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select(
      'xp level streak completedProjects'
    );
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    const [totalAvailableProjects] = await Promise.all([Project.countDocuments()]);
    const projectsCompleted = user.completedProjects?.length ?? 0;

    res.json({
      summary: {
        totalXp: user.xp ?? 0,
        level: user.level ?? 1,
        currentStreakDays: user.streak ?? 0,
        projectsCompleted,
        totalAvailableProjects,
        completionRate:
          totalAvailableProjects > 0
            ? Math.round((projectsCompleted / totalAvailableProjects) * 100)
            : 0,
        weeklyActivity: [] as Array<{ day: string; commits: number; tasks: number }>,
        weeklyActivityAvailable: false,
      },
    });
  } catch (error) {
    next(error);
  }
};
