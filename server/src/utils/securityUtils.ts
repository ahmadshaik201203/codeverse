/** Escapes user input before it is used inside a RegExp (prevents ReDoS/query abuse). */
export const escapeRegex = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Trims and hard-caps an arbitrary value to a string. */
export const clampString = (value: unknown, maxLength: number, fallback = ''): string => {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, maxLength);
};

/** Returns true only for absolute http(s) URLs (blocks javascript:/data: payloads). */
export const isSafeHttpUrl = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '123456789012',
  'qwertyuiop12',
  'letmein12345',
  'admin123456',
]);

export interface PasswordCheck {
  ok: boolean;
  message?: string;
}

/**
 * Server-side password policy. The client copy is UX only.
 * Length is the dominant factor for strength, so 12 is the floor.
 */
export const checkPasswordStrength = (password: unknown, email?: string): PasswordCheck => {
  if (typeof password !== 'string') {
    return { ok: false, message: 'Password must be a string.' };
  }
  if (password.length < 12) {
    return { ok: false, message: 'Password must be at least 12 characters long.' };
  }
  if (password.length > 128) {
    return { ok: false, message: 'Password must be at most 128 characters long.' };
  }
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, message: 'That password is too common. Choose something unique.' };
  }
  if (email && password.toLowerCase().includes(email.toLowerCase().split('@')[0])) {
    return { ok: false, message: 'Password must not contain your email name.' };
  }
  return { ok: true };
};

/** Caps an array of plain objects/strings without trusting its length. */
export const capArray = <T>(value: unknown, maxItems: number): T[] =>
  Array.isArray(value) ? (value.slice(0, maxItems) as T[]) : [];
