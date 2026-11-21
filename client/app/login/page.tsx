'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignInCard } from '@/components/auth/SignInCard';

const INVALID_CREDENTIALS = 'Email or password is incorrect';

/** Firebase deliberately hides which half of the credential was wrong. */
const describeSignInError = (code: string | undefined): string => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return INVALID_CREDENTIALS;
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Cannot reach Firebase. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled for this project.';
    default:
      return 'Could not sign you in. Please try again.';
  }
};

/**
 * Google sign-in failures. A user who closes the popup made a choice, not an
 * error, so those codes map to an empty string and render nothing.
 */
const describeGoogleError = (code: string | undefined): string => {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google popup. Allow pop-ups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'Google sign-in is not authorised for this domain. Add it under Firebase Authentication → Settings → Authorized domains.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this Firebase project.';
    case 'auth/network-request-failed':
      return 'Cannot reach Firebase. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    default:
      return 'Could not sign in with Google. Please try again.';
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Already signed in (or the session was restored): go to the dashboard.
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Let the user pick which Google account to use instead of silently
      // reusing the last one.
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(getFirebaseAuth(), provider);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = describeGoogleError((err as { code?: string }).code);
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter both your email and password to continue.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      setError(describeSignInError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      bare
      title="Sign in"
      description="Sign in to continue your engineering roadmap."
      footer={
        <p className="text-[13px] text-ink-muted">
          New to CodeVerse?{' '}
          <Link
            href="/register"
            className="font-medium text-forest underline-offset-4 transition-colors hover:text-forest-deep hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <SignInCard
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        loading={loading}
        googleLoading={googleLoading}
        error={error}
      />
    </AuthShell>
  );
}
