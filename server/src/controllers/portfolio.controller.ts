import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { AppError } from '../middleware/error';
import { isSafeHttpUrl } from '../utils/securityUtils';

/**
 * Public portfolio payload.
 * Deliberately excludes the account email address (SEC-10): this endpoint is
 * unauthenticated and must not expose contact details for enumeration.
 */
export const getPublicPortfolio = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const identifier = (req.params.identifier as string) || '';
    let query: Record<string, unknown> = { username: identifier.toLowerCase() };

    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      query = { $or: [{ _id: identifier }, { username: identifier.toLowerCase() }] };
    }

    const user = await User.findOne(query)
      .select(
        'fullName username college department year careerGoal experienceLevel bio githubUrl linkedinUrl portfolioWebsite xp level streak badges skills completedProjects'
      )
      .populate({
        path: 'completedProjects',
        select: 'title slug description domainSlug difficulty tags',
      });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Student portfolio not found.');
    }

    // Only projects the student actually completed. Never substitute random
    // catalogue entries as their work.
    const showcaseProjects = user.completedProjects ?? [];

    res.json({
      portfolio: {
        fullName: user.fullName,
        username: user.username || user.email.split('@')[0],
        college: user.college,
        department: user.department,
        year: user.year,
        careerGoal: user.careerGoal,
        experienceLevel: user.experienceLevel,
        bio: user.bio || '',
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        portfolioWebsite: user.portfolioWebsite || '',
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badges: user.badges || [],
        skills: user.skills || [],
        showcaseProjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPortfolio = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-password').populate('completedProjects');

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

interface PortfolioUpdate {
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioWebsite?: string;
  careerGoal?: string;
}

/**
 * Fields the account owner may never set directly.
 *
 * Skills, XP, levels, badges, streaks and completed projects are evidence of
 * verified work; they are written only by server-side services
 * (`services/skillService.ts`, `services/xpService.ts`) and never by a request
 * body. Accepting them here would let any student claim a perfect profile.
 */
const SERVER_OWNED_FIELDS = [
  'skills',
  'skillScores',
  'xp',
  'level',
  'streak',
  'badges',
  'completedProjects',
  'role',
  'email',
  'password',
  'onboarded',
  'firebaseUid',
  'authProvider',
] as const;

const rejectServerOwnedFields = (body: unknown): void => {
  if (!body || typeof body !== 'object') return;
  const payload = body as Record<string, unknown>;

  for (const field of SERVER_OWNED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      throw new AppError(
        422,
        'FIELD_NOT_EDITABLE',
        `${field} is managed by the server and cannot be set directly. Skill scores come from verified work.`
      );
    }
  }
};

export const updateMyPortfolio = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    rejectServerOwnedFields(req.body);

    const { bio, githubUrl, linkedinUrl, portfolioWebsite, careerGoal } =
      (req.body ?? {}) as PortfolioUpdate;

    for (const [field, value] of Object.entries({ githubUrl, linkedinUrl, portfolioWebsite })) {
      if (value !== undefined && value !== '' && !isSafeHttpUrl(value)) {
        throw new AppError(422, 'VALIDATION_ERROR', `${field} must be a valid http(s) URL.`);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      {
        $set: {
          ...(bio !== undefined && { bio: String(bio).slice(0, 1000) }),
          ...(githubUrl !== undefined && { githubUrl }),
          ...(linkedinUrl !== undefined && { linkedinUrl }),
          ...(portfolioWebsite !== undefined && { portfolioWebsite }),
          ...(careerGoal !== undefined && { careerGoal: String(careerGoal).slice(0, 120) }),
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    res.json({ message: 'Portfolio updated successfully.', user });
  } catch (error) {
    next(error);
  }
};
