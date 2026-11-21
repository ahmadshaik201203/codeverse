'use client';

import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Firebase web configuration.
 *
 * Read exclusively from NEXT_PUBLIC_FIREBASE_* variables (see .env.local.example).
 * These values identify the project in the browser bundle; they are not secrets.
 * There are intentionally no hardcoded fallbacks: a missing variable must fail
 * loudly instead of silently authenticating against another Firebase project.
 *
 * Only Authentication is initialised. Firestore, Storage and Analytics are not
 * imported or configured anywhere in this module.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const REQUIRED_KEYS = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const;

/** True when every required public Firebase variable is present. */
export const isFirebaseConfigured = (): boolean =>
  REQUIRED_KEYS.every((key) => Boolean(firebaseConfig[key]));

const assertConfigured = (): void => {
  const missing = REQUIRED_KEYS.filter((key) => !firebaseConfig[key]);
  if (missing.length > 0) {
    throw new Error(
      `Firebase Authentication is not configured. Missing ${missing
        .map((key) => `NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`)
        .join(', ')}. Copy .env.local.example to .env.local and fill in the Firebase web config.`
    );
  }
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

/** Reuses the app Firebase may already have created (hot reload, multiple imports). */
export const getFirebaseApp = (): FirebaseApp => {
  assertConfigured();
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return cachedApp;
};

/**
 * Lazily creates the Auth instance. Kept behind a function so importing this
 * module during server rendering never touches browser-only APIs.
 */
export const getFirebaseAuth = (): Auth => {
  if (!cachedAuth) {
    cachedAuth = getAuth(getFirebaseApp());
  }
  return cachedAuth;
};
