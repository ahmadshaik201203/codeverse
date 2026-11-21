'use client';

import React from 'react';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Google sign-in control, rendered with the round social button that the
 * sign-in card already styles (.cv-signin__social-btn). The authentication
 * itself is owned by the caller so this component stays presentational.
 */
type GoogleSignInButtonProps = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
};

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="currentColor"
        opacity="0.85"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="currentColor"
        opacity="0.7"
        d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.27-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="currentColor"
        opacity="0.55"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  onClick,
  loading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label="Continue with Google"
      aria-busy={loading}
      title={loading ? 'Connecting to Google…' : 'Continue with Google'}
      className="cv-signin__social-btn"
    >
      {loading ? <Spinner label="Connecting to Google" /> : <GoogleGlyph />}
    </button>
  );
}
