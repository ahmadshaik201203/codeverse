import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { AppError } from './error';
import { verifyFirebaseIdToken } from '../services/firebaseIdToken';

export type UserRole = 'student' | 'faculty' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

interface TokenPayload extends jwt.JwtPayload {
  id?: unknown;
  email?: unknown;
  role?: unknown;
}

const ROLES: readonly UserRole[] = ['student', 'faculty', 'admin'];

export const normalizeRole = (value: unknown): UserRole =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value)
    ? (value as UserRole)
    : 'student';

const unauthorized = (res: Response, requestId: string, code: string, message: string): void => {
  res.status(401).json({ error: { code, message }, requestId });
};

/**
 * Resolves a verified Firebase identity to an existing CodeVerse account.
 *
 * Deliberately read-only: it never creates a MongoDB user. Matching rules are
 * conservative — a verified uid always matches, while an email only matches a
 * Firebase account whose email Firebase has verified (for example Google), so
 * an unverified email/password registration cannot claim someone else's
 * account. The role always comes from the database record.
 */
const authenticateFirebaseToken = async (
  idToken: string,
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const verified = await verifyFirebaseIdToken(idToken);

    const matches: Array<Record<string, unknown>> = [{ firebaseUid: verified.uid }];
    if (verified.email && verified.emailVerified) {
      matches.push({ email: verified.email });
    }

    const user = await User.findOne({ $or: matches }).select('_id email role firebaseUid');

    if (!user) {
      res.status(403).json({
        error: {
          code: 'ACCOUNT_NOT_PROVISIONED',
          message:
            'Your Firebase account is verified, but no CodeVerse profile is linked to it. ' +
            'This API needs a provisioned account before it can serve data.',
        },
        requestId: req.id,
      });
      return;
    }

    req.user = {
      id: String(user._id),
      email: typeof user.email === 'string' ? user.email : '',
      // Role is advisory here only; requireRole re-reads it from the database.
      role: normalizeRole((user as { role?: unknown }).role),
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      res
        .status(error.status)
        .json({ error: { code: error.code, message: error.message }, requestId: req.id });
      return;
    }
    next(error);
  }
};

/**
 * Verifies the bearer token. Two token types are accepted:
 *
 *  1. The application JWT issued by this server (unchanged behaviour).
 *  2. A Firebase ID token, verified with the Firebase Admin SDK.
 *
 * The two are distinguished by the unverified `iss` claim purely to choose a
 * verification path; no identity is read until the chosen path has
 * cryptographically verified the token.
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    unauthorized(res, req.id, 'UNAUTHORIZED', 'Authorization denied. No token provided.');
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    unauthorized(res, req.id, 'UNAUTHORIZED', 'Authorization denied. No token provided.');
    return;
  }

  const unverified = jwt.decode(token) as { iss?: unknown } | null;
  const issuer = typeof unverified?.iss === 'string' ? unverified.iss : '';

  if (issuer.startsWith('https://securetoken.google.com/')) {
    await authenticateFirebaseToken(token, req, res, next);
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as TokenPayload;

    if (!decoded || typeof decoded.id !== 'string' || decoded.id.length === 0) {
      unauthorized(res, req.id, 'INVALID_TOKEN', 'Invalid token. Authorization failed.');
      return;
    }

    req.user = {
      id: decoded.id,
      email: typeof decoded.email === 'string' ? decoded.email : '',
      // Role in the token is advisory only; requireRole re-checks the database.
      role: normalizeRole(decoded.role),
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      unauthorized(res, req.id, 'TOKEN_EXPIRED', 'Token expired. Please login again.');
      return;
    }
    unauthorized(res, req.id, 'INVALID_TOKEN', 'Invalid token. Authorization failed.');
  }
};

/**
 * Authoritative role gate. Always reads the role from the database so a role
 * change takes effect immediately and a forged/stale token cannot grant access.
 */
export const requireRole =
  (...allowed: UserRole[]) =>
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      unauthorized(res, req.id, 'UNAUTHORIZED', 'Authentication required.');
      return;
    }

    try {
      const user = await User.findById(req.user.id).select('role').lean();

      if (!user) {
        unauthorized(res, req.id, 'UNAUTHORIZED', 'Account no longer exists.');
        return;
      }

      const role = normalizeRole((user as { role?: unknown }).role);

      if (!allowed.includes(role)) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to perform this action.',
          },
          requestId: req.id,
        });
        return;
      }

      req.user.role = role;
      next();
    } catch (error) {
      next(error);
    }
  };
