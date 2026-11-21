import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { AuthProvider, useAuth } from '@/context/AuthContext';

vi.mock('@/lib/firebase', () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

const mockedOnAuthStateChanged = vi.mocked(onAuthStateChanged);
const mockedSignOut = vi.mocked(signOut);

let emitAuthState: ((user: FirebaseUser | null) => void) | null = null;

// Built per test: the config restores mocks between tests, which clears a
// module-level mock's implementation.
const createFirebaseUser = (): FirebaseUser =>
  ({
    uid: 'uid-1',
    email: 'student@codeverse.test',
    displayName: null,
    getIdToken: vi.fn().mockResolvedValue('firebase-id-token'),
  }) as unknown as FirebaseUser;

function Probe() {
  const { user, token, loading, logout } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <span data-testid="name">{user?.fullName ?? 'none'}</span>
      <button type="button" onClick={logout}>
        Sign out
      </button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedOnAuthStateChanged.mockReset();
    mockedSignOut.mockClear();
    emitAuthState = null;

    mockedOnAuthStateChanged.mockImplementation((_auth, callback) => {
      emitAuthState = callback as (user: FirebaseUser | null) => void;
      return () => undefined;
    });
  });

  it('starts on the auth screen when nobody is signed in', async () => {
    renderProvider();

    await act(async () => {
      emitAuthState?.(null);
    });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('email').textContent).toBe('none');
    expect(screen.getByTestId('token').textContent).toBe('none');
  });

  it('adopts the Firebase session and exposes its ID token', async () => {
    renderProvider();

    await act(async () => {
      emitAuthState?.(createFirebaseUser());
    });

    await waitFor(() =>
      expect(screen.getByTestId('email').textContent).toBe('student@codeverse.test')
    );
    expect(screen.getByTestId('name').textContent).toBe('student');
    await waitFor(() => expect(screen.getByTestId('token').textContent).toBe('firebase-id-token'));
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('signs out of Firebase and clears the session', async () => {
    localStorage.setItem('token', 'legacy-token');
    renderProvider();

    await act(async () => {
      emitAuthState?.(createFirebaseUser());
    });
    await waitFor(() =>
      expect(screen.getByTestId('email').textContent).toBe('student@codeverse.test')
    );

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('none'));
    expect(mockedSignOut).toHaveBeenCalled();
    expect(screen.getByTestId('token').textContent).toBe('none');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
