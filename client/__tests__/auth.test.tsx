import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace, refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/firebase', () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {
    setCustomParameters() {
      return this;
    }
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

const mockedSignIn = vi.mocked(signInWithEmailAndPassword);
const mockedSignUp = vi.mocked(createUserWithEmailAndPassword);
const mockedPopup = vi.mocked(signInWithPopup);

const firebaseError = (code: string) => Object.assign(new Error(code), { code });

const alertText = () => screen.getByRole('alert').textContent ?? '';

describe('Login page', () => {
  beforeEach(() => {
    replace.mockReset();
    mockedSignIn.mockReset();
    mockedSignUp.mockReset();
    mockedPopup.mockReset();
  });

  it('opens the dashboard after a successful Google sign-in', async () => {
    mockedPopup.mockResolvedValue({ user: { uid: 'google-uid' } } as never);

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(mockedPopup).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('explains when the Google popup is blocked', async () => {
    mockedPopup.mockRejectedValue(firebaseError('auth/popup-blocked'));

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(alertText()).toMatch(/blocked the google popup/i));
    expect(replace).not.toHaveBeenCalled();
  });

  it('treats a closed Google popup as a cancellation, not an error', async () => {
    mockedPopup.mockRejectedValue(firebaseError('auth/popup-closed-by-user'));

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(mockedPopup).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('validates empty fields without calling Firebase', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(alertText()).toMatch(/enter both your email and password/i);
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it('signs in with email and password, then opens the dashboard', async () => {
    mockedSignIn.mockResolvedValue({ user: { uid: 'uid-1' } } as never);

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email address/i), 'student@codeverse.test');
    await user.type(screen.getByLabelText(/^password$/i), 'PhaseA#Strong2026');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() =>
      expect(mockedSignIn).toHaveBeenCalledWith(expect.anything(), 'student@codeverse.test', 'PhaseA#Strong2026')
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows the required message when the credentials are wrong', async () => {
    mockedSignIn.mockRejectedValue(firebaseError('auth/invalid-credential'));

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email address/i), 'student@codeverse.test');
    await user.type(screen.getByLabelText(/^password$/i), 'WrongPassword#2026');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => expect(alertText()).toBe('Email or password is incorrect'));
    expect(replace).not.toHaveBeenCalled();
  });

  it('treats an unknown account the same way as a wrong password', async () => {
    mockedSignIn.mockRejectedValue(firebaseError('auth/user-not-found'));

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email address/i), 'nobody@codeverse.test');
    await user.type(screen.getByLabelText(/^password$/i), 'SomePassword#2026');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => expect(alertText()).toBe('Email or password is incorrect'));
  });
});

describe('Register page', () => {
  beforeEach(() => {
    replace.mockReset();
    mockedSignIn.mockReset();
    mockedSignUp.mockReset();
  });

  const fillSignUp = async (email: string, password: string) => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), email);
    await user.type(screen.getByLabelText(/^password$/i), password);
    await user.type(screen.getByLabelText(/confirm password/i), password);
    await user.click(screen.getByRole('button', { name: /create free account/i }));
  };

  it('creates the account and opens the dashboard', async () => {
    mockedSignUp.mockResolvedValue({ user: { uid: 'uid-2' } } as never);

    render(<RegisterPage />);
    await fillSignUp('new@codeverse.test', 'PhaseB#Strong2026');

    await waitFor(() =>
      expect(mockedSignUp).toHaveBeenCalledWith(expect.anything(), 'new@codeverse.test', 'PhaseB#Strong2026')
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows the required message when the email already exists', async () => {
    mockedSignUp.mockRejectedValue(firebaseError('auth/email-already-in-use'));

    render(<RegisterPage />);
    await fillSignUp('taken@codeverse.test', 'PhaseB#Strong2026');

    await waitFor(() => expect(alertText()).toBe('User already exists. Please sign in'));
    expect(replace).not.toHaveBeenCalled();
  });

  it('refuses mismatched passwords before calling Firebase', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/email address/i), 'new@codeverse.test');
    await user.type(screen.getByLabelText(/^password$/i), 'PhaseB#Strong2026');
    await user.type(screen.getByLabelText(/confirm password/i), 'PhaseB#Other2026');
    await user.click(screen.getByRole('button', { name: /create free account/i }));

    await waitFor(() => expect(alertText()).toMatch(/passwords do not match/i));
    expect(mockedSignUp).not.toHaveBeenCalled();
  });
});
