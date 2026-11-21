'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from './ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarded?: boolean;
}

export default function ProtectedRoute({ children, requireOnboarded = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireOnboarded && !user.onboarded) {
        router.push('/onboarding');
      }
    }
  }, [user, loading, requireOnboarded, router]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 text-ink-muted"
        role="status"
        aria-live="polite"
      >
        <Spinner className="h-6 w-6 text-forest" />
        <p className="font-mono text-[11px] uppercase tracking-[0.18em]">
          Restoring your session
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
