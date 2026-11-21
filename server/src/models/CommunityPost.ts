import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityReply {
  _id?: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  content: string;
  createdAt: Date;
  upvotes: number;
}

export interface ICommunityPost extends Document {
  title: string;
  content: string;
  tags: string[];
  domainSlug?: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorCollege?: string;
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  replies: ICommunityReply[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunityReplySchema = new Schema<ICommunityReply>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    domainSlug: { type: String, default: 'web-dev' },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorCollege: { type: String, default: '' },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [CommunityReplySchema],
  },
  { timestamps: true }
);

export const CommunityPost: Model<ICommunityPost> =
  mongoose.models.CommunityPost || mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
