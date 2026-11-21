import { randomUUID } from 'crypto';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { AppError } from '../middleware/error';
import { grantXp, isXpAction, XP_PER_LEVEL } from '../services/xpService';

/**
 * Real leaderboard: no padding. A student with 0 XP is shown with 0 XP.
 */
export const getLeaderboard = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const topUsers = await User.find({})
      .select('fullName username college department xp level streak badges')
      .sort({ xp: -1, _id: 1 })
      .limit(20);

    const leaderboard = topUsers.map((u, idx) => ({
      rank: idx + 1,
      id: u._id,
      fullName: u.fullName,
      username: u.username || String(u._id),
      college: u.college || '',
      department: u.department || '',
      xp: u.xp ?? 0,
      level: u.level ?? 1,
      streak: u.streak ?? 0,
      badgeCount: u.badges?.length ?? 0,
    }));

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
};

/**
 * Administrative / verified award path.
 *
 * The client supplies an action name and an optional dedupe key — never an
 * amount. Replaying the same key returns the existing balance without
 * incrementing it again.
 */
export const awardXp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = String(req.user?.id ?? '');
    const { actionType, dedupeKey } = req.body as {
      actionType?: string;
      dedupeKey?: string;
    };

    if (!isXpAction(actionType)) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Unsupported actionType.');
    }

    const supplied = typeof dedupeKey === 'string' ? dedupeKey.trim().slice(0, 80) : '';
    const key = supplied
      ? `admin:${userId}:${actionType}:${supplied}`
      : `admin:${userId}:${actionType}:${randomUUID()}`;

    const result = await grantXp(userId, actionType, key);

    if (result.duplicate) {
      res.json({
        message: 'XP was already awarded for this action.',
        duplicate: true,
        xpEarned: 0,
        currentXp: result.xp,
        currentLevel: result.level,
      });
      return;
    }

    res.json({
      message: `+${result.amount} XP earned.`,
      duplicate: false,
      xpEarned: result.amount,
      currentXp: result.xp,
      currentLevel: result.level,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Real gamification stats. No invented defaults: a new account reports 0 XP.
 */
export const getGamificationStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('xp level streak badges skills');
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    const xp = user.xp ?? 0;
    const level = user.level ?? 1;

    res.json({
      stats: {
        xp,
        level,
        streak: user.streak ?? 0,
        xpForNextLevel: level * XP_PER_LEVEL,
        xpProgressInLevel: xp % XP_PER_LEVEL,
        badges: user.badges ?? [],
        skills: user.skills ?? [],
      },
    });
  } catch (error) {
    next(error);
  }
};
