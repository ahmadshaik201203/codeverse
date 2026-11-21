import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Load .env from the project's server directory regardless of the process cwd.
 * `__dirname` resolves to src/config (ts-node) or dist/config (compiled), and
 * `../../.env` is the server root in both cases.
 */
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

const problems: string[] = [];

const readRequired = (name: string, minLength = 1): string => {
  const raw = process.env[name];
  const value = typeof raw === 'string' ? raw.trim() : '';

  if (!value) {
    problems.push(`${name} is required but was not set.`);
    return '';
  }
  if (value.length < minLength) {
    problems.push(`${name} must be at least ${minLength} characters long.`);
    return '';
  }
  return value;
};

const readOptional = (name: string, fallback = ''): string => {
  const raw = process.env[name];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : fallback;
};

const readInt = (name: string, fallback: number, min = 1): number => {
  const raw = readOptional(name, '');
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < min) {
    problems.push(`${name} must be an integer >= ${min}.`);
    return fallback;
  }
  return parsed;
};

/**
 * Ports are occasionally left blank or set to 0 in a local env file. Those are
 * "let me pick a port" values, not configuration errors: fall back instead of
 * refusing to boot.
 */
const readPort = (name: string, fallback: number): number => {
  const raw = readOptional(name, '');
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
    console.warn(`[Config] ${name}="${raw}" is not a usable port; falling back to ${fallback}.`);
    return fallback;
  }
  return parsed;
};

const nodeEnv = readOptional('NODE_ENV', 'development');
const isProduction = nodeEnv === 'production';

const parseOrigins = (raw: string): string[] =>
  raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

const configuredOrigins = parseOrigins(readOptional('CORS_ORIGINS', ''));

if (configuredOrigins.length === 0) {
  if (isProduction) {
    problems.push('CORS_ORIGINS is required in production (comma-separated trusted origins).');
  }
}

/** Local dev servers (`npm run dev` on 3000, `next start` on 3200). */
const DEV_DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3200',
  'http://127.0.0.1:3200',
];

const corsOrigins =
  configuredOrigins.length > 0
    ? configuredOrigins
    : isProduction
      ? ['http://localhost:3000', 'http://127.0.0.1:3000']
      : DEV_DEFAULT_ORIGINS;

/**
 * Central, typed configuration. Secrets are read once here and never logged.
 * Note: this module never exits the process; call assertEnv() from the entrypoint.
 */
export const env = {
  nodeEnv,
  isProduction,
  port: readPort('PORT', 5000),

  mongoUri: readRequired('MONGODB_URI'),
  jwtSecret: readRequired('JWT_SECRET', 32),
  jwtExpiresIn: readOptional('JWT_EXPIRES_IN', '7d'),

  corsOrigins,
  /** Number of trusted proxy hops. Leave 0 unless running behind a known proxy. */
  trustProxy: readInt('TRUST_PROXY', 0, 0),

  geminiApiKey: readOptional('GEMINI_API_KEY', ''),
  geminiModel: readOptional('GEMINI_MODEL', 'gemini-2.5-flash'),
  geminiTimeoutMs: readInt('GEMINI_TIMEOUT_MS', 45000, 1000),

  firebaseProjectId: readOptional('FIREBASE_PROJECT_ID', ''),
  /**
   * Optional service-account credentials. ID-token verification works with the
   * project id alone; these are only needed for Admin operations that mint
   * tokens. They must never be sent to the browser.
   */
  firebaseClientEmail: readOptional('FIREBASE_CLIENT_EMAIL', ''),
  firebasePrivateKey: readOptional('FIREBASE_PRIVATE_KEY', ''),

  authRateLimitWindowMs: readInt('AUTH_RATE_LIMIT_WINDOW_MINUTES', 15) * 60 * 1000,
  authRateLimitMaxAttempts: readInt('AUTH_RATE_LIMIT_MAX_ATTEMPTS', 5),
  aiRateLimitPerHour: readInt('AI_RATE_LIMIT_PER_HOUR', 20),
  aiRateLimitPerDay: readInt('AI_RATE_LIMIT_PER_DAY', 200),
} as const;

/**
 * Fails fast when required configuration is missing.
 * Only variable NAMES are printed — never values.
 */
export const assertEnv = (): void => {
  if (problems.length === 0) return;

  console.error('[Config] Refusing to start. Fix the following environment problems:');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  console.error('[Config] See .env.example for the required variables.');
  process.exit(1);
};

export const isFirebaseConfigured = (): boolean => env.firebaseProjectId.length > 0;
export const isGeminiConfigured = (): boolean => env.geminiApiKey.length > 0;
