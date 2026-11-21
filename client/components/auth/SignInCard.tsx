'use client';

import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { GoogleSignInButton } from './GoogleSignInButton';
import './signin.css';

/**
 * Sign In card — structure, interaction and layout from Uiverse.io
 * "swift-liger-76" by Smit-Prajapati (Smit Prajapati), MIT License.
 * See ./signin.css for the palette adaptation notes.
 *
 * Deliberate omissions from the original, because CodeVerse has no such
 * features: the "Forgot Password ?" link (no reset route or endpoint
 * exists) and the "Learn user licence agreement" footnote (no licence
 * page exists). No dead links are rendered in their place.
 *
 * Authentication stays with the caller (Firebase email/password and Google):
 * this component owns only the presentation and the password-visibility toggle.
 */
type SignInCardProps = {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onGoogleSignIn: () => void;
  loading?: boolean;
  googleLoading?: boolean;
  error?: string;
};

export function SignInCard({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleSignIn,
  loading = false,
  googleLoading = false,
  error = '',
}: SignInCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  const invalid = Boolean(error);
  const describedBy = error ? 'login-error' : undefined;

  return (
    <section className="cv-signin" aria-labelledby="signin-heading">
      <h1 id="signin-heading" className="cv-signin__heading">
        Sign In
      </h1>
      <p className="cv-signin__subheading">Continue your engineering roadmap.</p>

      {error ? (
        <p id="login-error" role="alert" className="cv-signin__alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}

      {/* method="post" keeps credentials out of the URL if a submit ever
          happens before hydration attaches the handler. */}
      <form className="cv-signin__form" onSubmit={onSubmit} method="post" noValidate>
        <label htmlFor="login-email" className="cv-signin__label">
          Email address
        </label>
        <div className="cv-signin__field">
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            disabled={loading}
            className="cv-signin__input"
            placeholder="you@college.edu"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
          />
        </div>

        <label htmlFor="login-password" className="cv-signin__label">
          Password
        </label>
        <div className="cv-signin__field cv-signin__field--password">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={loading}
            className="cv-signin__input"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
          />
          <button
            type="button"
            className="cv-signin__eye"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            aria-controls="login-password"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <button type="submit" className="cv-signin__submit" disabled={loading} aria-busy={loading}>
          {loading ? (
            <>
              <Spinner label="Signing in" />
              Signing in…
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="cv-signin__social">
        <span className="cv-signin__social-title">Or sign in with</span>
        <div className="cv-signin__social-accounts">
          <GoogleSignInButton
            onClick={onGoogleSignIn}
            loading={googleLoading}
            disabled={loading}
          />
        </div>
      </div>
    </section>
  );
}
