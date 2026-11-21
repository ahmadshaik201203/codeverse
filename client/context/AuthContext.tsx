'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { setAuthTokenProvider } from '@/lib/api';

export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  college: string;
  department: string;
  year: string;
  preferredLanguage: string;
  onboarded: boolean;
  role?: UserRole;
  avatarUrl?: string;
  careerGoal?: string;
  experienceLevel?: string;
  knownTechnologies?: string[];
  learningLanguage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Builds the view model the existing screens expect from the Firebase account.
 * No profile fields are stored: the account only carries its email (and an
 * optional display name Firebase may return), so nothing is persisted here.
 */
const toAppUser = (firebaseUser: FirebaseUser): User => ({
  _id: firebaseUser.uid,
  fullName:
    firebaseUser.displayName?.trim() || firebaseUser.email?.split('@')[0] || 'Engineer',
  email: firebaseUser.email ?? '',
  college: '',
  department: '',
  year: '',
  preferredLanguage: 'English',
  // There is no stored profile yet, so onboarding is not part of this flow;
  // a successful sign-in goes straight to the dashboard.
  onboarded: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Registered during render, not only in an effect: child effects run before
  // the provider's own effect, so a dashboard page that loads data on mount
  // would otherwise fire its first requests without a token.
  const provideToken = async () => {
    const auth = getFirebaseAuth();
    // On a fresh load Firebase restores the persisted session asynchronously;
    // wait for it so the first API calls carry a token instead of returning 401.
    try {
      await auth.authStateReady();
    } catch {
      // Fall through: a failed restore simply means no token.
    }
    const current = auth.currentUser;
    return current ? current.getIdToken() : null;
  };
  setAuthTokenProvider(provideToken);

  useEffect(() => {
    let cancelled = false;

    // Re-register on mount: development StrictMode runs an extra
    // mount/unmount cycle, and the provider must survive it.
    setAuthTokenProvider(provideToken);

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      if (cancelled) return;

      if (!firebaseUser) {
        // Drop any session left behind by the previous password flow.
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      setUser(toAppUser(firebaseUser));

      try {
        const idToken = await firebaseUser.getIdToken();
        if (!cancelled) setToken(idToken);
      } catch {
        if (!cancelled) setToken(null);
      }

      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(getFirebaseAuth());
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
