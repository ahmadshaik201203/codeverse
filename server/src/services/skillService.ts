import mongoose from 'mongoose';
import { User } from '../models/User';
import { AppError } from '../middleware/error';

export const MAX_SKILL_SCORE = 100;
export const MIN_SKILL_SCORE = 0;

/** Points a single verified task adds to the project's domain skill. */
export const VERIFIED_TASK_SKILL_POINTS = 5;

const clampScore = (value: number): number =>
  Math.max(MIN_SKILL_SCORE, Math.min(MAX_SKILL_SCORE, Math.round(value)));

/**
 * Server-owned skill progression.
 *
 * The only way a skill score changes is this function, and it only ever takes an
 * increment — a caller cannot set an absolute score. Callers must be verified
 * backend paths (a passed task evaluation, a reviewed submission), never a raw
 * request body. See `updateMyPortfolio`, which rejects client-supplied skills.
 */
export const recordVerifiedSkill = async (
  userId: string,
  skillName: string,
  points: number
): Promise<{ name: string; score: number }> => {
  const name = typeof skillName === 'string' ? skillName.trim().slice(0, 60) : '';

  if (!name) {
    throw new AppError(422, 'VALIDATION_ERROR', 'A skill name is required.');
  }
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid user id.');
  }
  if (typeof points !== 'number' || !Number.isFinite(points) || points <= 0 || points > MAX_SKILL_SCORE) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Skill points must be a positive number within range.');
  }

  // Load the whole document: the model's pre-save hook reads identity fields.
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found.');
  }

  const existing = (user.skills ?? []).find(
    (skill) => skill.name.toLowerCase() === name.toLowerCase()
  );

  const nextScore = clampScore((existing?.score ?? 0) + points);

  if (existing) {
    existing.score = nextScore;
  } else {
    user.skills.push({ name, score: nextScore });
  }

  await user.save();

  return { name: existing?.name ?? name, score: nextScore };
};
