import mongoose from 'mongoose';
import { User } from '../models/User';
import { XpEvent, XpAction } from '../models/XpEvent';
import { AppError } from '../middleware/error';

/**
 * Server-owned XP amounts. The browser never supplies a number.
 */
export const XP_AWARD_TABLE: Record<XpAction, number> = {
  task_verified: 100,
  code_review: 75,
  sandbox_run: 20,
  blueprint_view: 30,
};

export const XP_PER_LEVEL = 200;

export interface GrantResult {
  duplicate: boolean;
  amount: number;
  xp: number;
  level: number;
}

let indexesReady: Promise<unknown> | null = null;
const ensureIndexes = (): Promise<unknown> => {
  indexesReady = indexesReady ?? XpEvent.init();
  return indexesReady;
};

export const isXpAction = (value: unknown): value is XpAction =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(XP_AWARD_TABLE, value);

/**
 * Award XP exactly once per `dedupeKey`.
 *
 * - The ledger insert is the gate: a duplicate key means the award already
 *   happened, so nothing is incremented.
 * - The increment is a single atomic pipeline update, so concurrent awards
 *   cannot overwrite each other (no read-modify-write race).
 * - XP is clamped with $max to 0, so it can never go negative.
 */
export const grantXp = async (
  userId: string,
  action: XpAction,
  dedupeKey: string
): Promise<GrantResult> => {
  if (!isXpAction(action)) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Unsupported XP action.');
  }
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid user id.');
  }

  const amount = XP_AWARD_TABLE[action];
  await ensureIndexes();

  let inserted = false;
  try {
    await XpEvent.create({ userId, action, amount, dedupeKey });
    inserted = true;
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code !== 11000) throw error;
  }

  if (!inserted) {
    const current = await User.findById(userId).select('xp level');
    if (!current) throw new AppError(404, 'NOT_FOUND', 'User not found.');
    return { duplicate: true, amount: 0, xp: current.xp ?? 0, level: current.level ?? 1 };
  }

  // Use the native driver: Mongoose casts a pipeline's $set values against the
  // schema and rejects these aggregation expressions as invalid Number casts.
  const updated = (await User.collection.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(userId) },
    [
      { $set: { xp: { $max: [0, { $add: [{ $ifNull: ['$xp', 0] }, amount] }] } } },
      {
        $set: {
          level: {
            $max: [1, { $add: [{ $floor: { $divide: ['$xp', XP_PER_LEVEL] } }, 1] }],
          },
        },
      },
    ],
    { returnDocument: 'after' }
  )) as { xp?: number; level?: number } | null;

  if (!updated) {
    // Never leave a ledger row behind for an award that did not happen.
    await XpEvent.deleteOne({ dedupeKey });
    throw new AppError(404, 'NOT_FOUND', 'User not found.');
  }

  return { duplicate: false, amount, xp: updated.xp ?? 0, level: updated.level ?? 1 };
};
