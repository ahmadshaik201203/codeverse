import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env, isFirebaseConfigured } from '../config/env';
import { AppError } from '../middleware/error';

export interface VerifiedFirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoUrl: string | null;
  signInProvider: string;
  phoneNumber: string | null;
}

/**
 * Firebase Admin SDK verification. Identity is taken only from the verified
 * token — never from a request body, header or query parameter.
 *
 * The project id is enough to verify ID tokens: the Admin SDK checks the RS256
 * signature against Google's published certificates and validates audience,
 * issuer, expiry and subject. A service account is only required to *mint*
 * tokens, so those credentials stay optional here and are never exposed to the
 * browser.
 */
let adminApp: App | null = null;

const getAdminApp = (): App => {
  if (!isFirebaseConfigured()) {
    throw new AppError(
      503,
      'AUTH_PROVIDER_NOT_CONFIGURED',
      'Google sign-in is not configured on this server. Set FIREBASE_PROJECT_ID.'
    );
  }

  if (!adminApp) {
    const existing = getApps()[0];
    adminApp =
      existing ??
      initializeApp({
        projectId: env.firebaseProjectId,
        ...(env.firebaseClientEmail && env.firebasePrivateKey
          ? {
              credential: cert({
                projectId: env.firebaseProjectId,
                clientEmail: env.firebaseClientEmail,
                privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n'),
              }),
            }
          : {}),
      });
  }

  return adminApp;
};

const mapVerificationError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;

  const code = (error as { code?: string }).code;

  switch (code) {
    case 'auth/id-token-expired':
    case 'auth/user-token-expired':
      return new AppError(
        401,
        'TOKEN_EXPIRED',
        'Authentication token has expired. Please sign in again.'
      );
    case 'auth/id-token-revoked':
    case 'auth/user-token-revoked':
      return new AppError(401, 'TOKEN_REVOKED', 'This session was revoked. Please sign in again.');
    case 'auth/argument-error':
    case 'auth/invalid-id-token':
      return new AppError(401, 'INVALID_TOKEN', 'Malformed authentication token.');
    case 'app/invalid-credential':
    case 'auth/invalid-credential':
      return new AppError(
        503,
        'AUTH_PROVIDER_UNAVAILABLE',
        'The identity provider is misconfigured. Contact an administrator.'
      );
    default:
      // Provide a server-side diagnostic trail without logging the token itself.
      console.warn(
        JSON.stringify({
          level: 'warn',
          scope: 'firebase-token-verification',
          code: code ?? 'unknown',
          message: (error as { message?: string }).message ?? 'unknown',
        })
      );
      return new AppError(401, 'INVALID_TOKEN', 'Authentication token could not be verified.');
  }
};

export const verifyFirebaseIdToken = async (idToken: string): Promise<VerifiedFirebaseUser> => {
  if (typeof idToken !== 'string' || idToken.split('.').length !== 3) {
    throw new AppError(401, 'INVALID_TOKEN', 'Malformed authentication token.');
  }

  let decoded: Awaited<ReturnType<ReturnType<typeof getAuth>['verifyIdToken']>>;

  /**
   * Revocation checks read the account record and therefore need service
   * account credentials. Without them the SDK still verifies the signature,
   * audience, issuer, expiry and subject — so only the revocation lookup is
   * skipped, and no unverified token is ever accepted.
   */
  const canCheckRevoked = Boolean(env.firebaseClientEmail && env.firebasePrivateKey);

  try {
    decoded = await getAuth(getAdminApp()).verifyIdToken(idToken, canCheckRevoked);
  } catch (error) {
    throw mapVerificationError(error);
  }

  if (!decoded.uid) {
    throw new AppError(401, 'INVALID_TOKEN', 'Authentication token is missing a subject.');
  }

  return {
    uid: decoded.uid,
    email: typeof decoded.email === 'string' ? decoded.email.toLowerCase().trim() : null,
    emailVerified: decoded.email_verified === true,
    displayName: typeof decoded.name === 'string' ? decoded.name : null,
    photoUrl: typeof decoded.picture === 'string' ? decoded.picture : null,
    signInProvider: decoded.firebase?.sign_in_provider ?? 'unknown',
    phoneNumber: typeof decoded.phone_number === 'string' ? decoded.phone_number : null,
  };
};
