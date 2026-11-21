'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { JellyButton } from '@/components/ui/JellyButton';
import { Field, Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';

const EMAIL_EXISTS = 'User already exists. Please sign in';

const describeSignUpError = (code: string | undefined): string => {
  switch (code) {
    case 'auth/email-already-in-use':
      return EMAIL_EXISTS;
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Choose a password of at least six characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Cannot reach Firebase. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-up is not enabled for this project.';
    default:
      return 'Could not create your account. Please try again.';
  }
};

export default function RegisterPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password || !confirmPassword) {
      setError('Enter your email and a password to create your account.');
      return;
    }
    if (password.length < 6) {
      setError('Choose a password of at least six characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      setError(describeSignUpError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      description="Sign up with your email and a password."
      footer={
        <p className="text-[13px] text-ink-muted">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-forest underline-offset-4 transition-colors hover:text-forest-deep hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {error ? (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-control border border-[var(--color-danger)]/30 bg-[var(--color-danger-tint)] px-3.5 py-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" aria-hidden="true" />
          <p className="text-[12.5px] leading-relaxed text-[var(--color-danger)]">{error}</p>
        </div>
      ) : null}

      {/* method="post" keeps credentials out of the URL if a submit ever
          happens before hydration attaches the handler. */}
      <form onSubmit={handleSubmit} method="post" className="space-y-5" noValidate>
        <Field label="Email address" htmlFor="reg-email">
          <Input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            icon={Mail}
            placeholder="you@college.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field label="Password" htmlFor="reg-password" hint="At least 6 characters">
          <Input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            icon={Lock}
            placeholder="Create a password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <Field label="Confirm password" htmlFor="reg-confirm">
          <Input
            id="reg-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            icon={Lock}
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>

        <JellyButton type="submit" fullWidth disabled={loading}>
          {loading ? (
            <>
              <Spinner label="Creating account" />
              Creating account…
            </>
          ) : (
            <>
              Create free account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </JellyButton>

        <p className="text-center text-[11.5px] leading-relaxed text-ink-faint">
          By creating an account you agree to use CodeVerse for genuine practice.
        </p>
      </form>
    </AuthShell>
  );
}
