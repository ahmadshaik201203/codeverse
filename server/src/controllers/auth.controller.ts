import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { AuthRequest, normalizeRole } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { env } from '../config/env';
import { checkPasswordStrength } from '../utils/securityUtils';
import { verifyFirebaseIdToken } from '../services/firebaseIdToken';

const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      role: normalizeRole(user.role),
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] }
  );
};

const publicUser = (user: IUser): Record<string, unknown> => {
  const object = user.toObject() as Record<string, unknown>;
  delete object.password;
  return object;
};

interface RegisterBody {
  fullName: string;
  email: string;
  password: string;
  college: string;
  department: string;
  year: string;
  preferredLanguage?: string;
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, email, password, college, department, year, preferredLanguage } =
      req.body as RegisterBody;

    const passwordCheck = checkPasswordStrength(password, email);
    if (!passwordCheck.ok) {
      throw new AppError(422, 'WEAK_PASSWORD', passwordCheck.message ?? 'Password is too weak.');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists.');
    }

    const user = await User.create({
      fullName,
      email,
      password,
      college,
      department,
      year,
      preferredLanguage: preferredLanguage || 'English',
    });

    res.status(201).json({
      message: 'Registration successful',
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email });

    // Same response for unknown email and wrong password: no account enumeration.
    if (!user || !user.password) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    res.json({
      message: 'Login successful',
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Exchanges a provider ID token for a CodeVerse session.
 * Identity comes exclusively from the cryptographically verified token; any
 * email/fullName the client sends in the body is ignored by the validator.
 */
export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { idToken } = req.body as { idToken: string };
    const verified = await verifyFirebaseIdToken(idToken);

    const isPhone = verified.signInProvider === 'phone';
    const derivedEmail =
      verified.email ??
      (verified.phoneNumber
        ? `${verified.phoneNumber.replace(/[^0-9]/g, '')}@phone.codeverse.local`
        : null);

    if (!derivedEmail) {
      throw new AppError(
        422,
        'EMAIL_REQUIRED',
        'This account does not expose an email address. Sign in with email and password instead.'
      );
    }

    if (!isPhone && !verified.emailVerified) {
      throw new AppError(
        403,
        'EMAIL_NOT_VERIFIED',
        'Your provider account email is not verified. Verify it and try again.'
      );
    }

    const authProvider = isPhone ? 'phone' : 'google';
    let user = await User.findOne({ email: derivedEmail });

    if (user) {
      let modified = false;

      if (!user.firebaseUid) {
        user.firebaseUid = verified.uid;
        modified = true;
      }
      if (!user.avatarUrl && verified.photoUrl) {
        user.avatarUrl = verified.photoUrl;
        modified = true;
      }
      if (!user.fullName && verified.displayName) {
        user.fullName = verified.displayName;
        modified = true;
      }

      if (modified) await user.save();
    } else {
      user = await User.create({
        fullName: verified.displayName || derivedEmail.split('@')[0],
        email: derivedEmail,
        authProvider,
        firebaseUid: verified.uid,
        avatarUrl: verified.photoUrl || '',
        college: 'Engineering College',
        department: 'Computer Science',
        year: '1st Year',
        preferredLanguage: 'English',
        onboarded: false,
      });
    }

    res.json({
      message: 'Authentication successful',
      token: generateToken(user),
      user: publicUser(user),
      isNewUser: !user.onboarded,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const onboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    const { careerGoal, experienceLevel, knownTechnologies, learningLanguage } = req.body as {
      careerGoal: string;
      experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
      knownTechnologies?: string[];
      learningLanguage?: string;
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        careerGoal,
        experienceLevel,
        knownTechnologies: knownTechnologies ?? [],
        ...(learningLanguage ? { learningLanguage } : {}),
        onboarded: true,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    res.json({
      message: 'Onboarding completed successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
