import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Append-only record of every XP award.
 *
 * The unique `dedupeKey` is what makes awards idempotent: two concurrent
 * requests carrying the same key can only insert once, so XP cannot be
 * awarded twice for the same action.
 */
export type XpAction =
  | 'task_verified'
  | 'code_review'
  | 'sandbox_run'
  | 'blueprint_view';

export interface IXpEvent extends Document {
  userId: mongoose.Types.ObjectId;
  action: XpAction;
  amount: number;
  dedupeKey: string;
  createdAt: Date;
}

const XpEventSchema = new Schema<IXpEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    // Amount is decided by the server, never by a request body.
    amount: { type: Number, required: true, min: 1 },
    dedupeKey: { type: String, required: true, unique: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const XpEvent: Model<IXpEvent> =
  mongoose.models.XpEvent || mongoose.model<IXpEvent>('XpEvent', XpEventSchema);
