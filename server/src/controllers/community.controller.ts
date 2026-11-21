import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { CommunityPost } from '../models/CommunityPost';
import { User } from '../models/User';
import { escapeRegex } from '../utils/securityUtils';
import { AppError } from '../middleware/error';

export const getPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { domain, search } = req.query;
    const filter: Record<string, unknown> = {};

    if (typeof domain === 'string' && domain !== 'all') {
      filter.domainSlug = domain.slice(0, 60);
    }

    if (typeof search === 'string') {
      // Escape user input: never build a RegExp straight from a query parameter.
      const safeTerm = escapeRegex(search.trim().slice(0, 100));
      if (safeTerm.length > 0) {
        filter.$or = [
          { title: { $regex: safeTerm, $options: 'i' } },
          { content: { $regex: safeTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(safeTerm, 'i')] } },
        ];
      }
    }

    const posts = await CommunityPost.find(filter).sort({ createdAt: -1 }).limit(30);

    // No seeded content: an empty community legitimately returns an empty list.
    res.json({ posts });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { title, content, tags, domainSlug } = req.body as {
      title: string;
      content: string;
      tags?: string[];
      domainSlug?: string;
    };

    const user = await User.findById(userId).select('fullName college');
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    const newPost = await CommunityPost.create({
      title,
      content,
      tags: tags && tags.length > 0 ? tags : ['Discussion'],
      domainSlug: domainSlug || 'general',
      authorId: userId,
      authorName: user.fullName,
      authorCollege: user.college || '',
      upvotes: 0,
      replies: [],
    });

    // Posting does not award XP. Gamification only moves through grantXp(),
    // which is reachable from verified/admin paths, never from user posts.
    res.status(201).json({ message: 'Post published.', post: newPost });
  } catch (error) {
    next(error);
  }
};

export const addReply = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { content } = req.body as { content: string };

    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(404, 'NOT_FOUND', 'Post not found.');
    }

    const [user, post] = await Promise.all([
      User.findById(userId).select('fullName'),
      CommunityPost.findById(id),
    ]);

    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found.');
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found.');

    post.replies.push({
      authorId: userId as unknown as mongoose.Types.ObjectId,
      authorName: user.fullName,
      content,
      createdAt: new Date(),
      upvotes: 0,
    });

    await post.save();

    res.status(201).json({ message: 'Answer posted.', post });
  } catch (error) {
    next(error);
  }
};

export const upvotePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(404, 'NOT_FOUND', 'Post not found.');
    }

    const post = await CommunityPost.findById(id);
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found.');

    // One vote per account: repeated requests must not inflate the counter.
    const alreadyVoted = post.upvotedBy?.some((voter) => String(voter) === String(userId));
    if (alreadyVoted) {
      res.json({ message: 'Already upvoted.', upvotes: post.upvotes });
      return;
    }

    const updated = await CommunityPost.findOneAndUpdate(
      { _id: id, upvotedBy: { $ne: userId } },
      { $inc: { upvotes: 1 }, $addToSet: { upvotedBy: userId } },
      { new: true }
    );

    res.json({ message: 'Upvoted!', upvotes: updated?.upvotes ?? post.upvotes });
  } catch (error) {
    next(error);
  }
};
