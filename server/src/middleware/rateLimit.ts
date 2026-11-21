import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed per key per window. */
  max: number;
  /** Namespace so separate limiters do not share counters. */
  keyPrefix: string;
  /** Derives the bucket key. Defaults to the client IP. */
  key?: (req: Request) => string;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

const sweep = (now: number): void => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

/**
 * Fixed-window, in-memory rate limiter (no external dependency).
 * Single-process only: with multiple API instances each holds its own counters,
 * so a shared store (Redis) is required before horizontal scaling.
 */
export const rateLimit =
  (options: RateLimitOptions) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = `${options.keyPrefix}:${(options.key ? options.key(req) : req.ip) || 'unknown'}`;

    if (buckets.size > MAX_TRACKED_KEYS) sweep(now);

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, options.max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (bucket.count > options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message:
            options.message ?? 'Too many requests. Please wait a moment and try again.',
          retryAfterSeconds,
        },
        requestId: req.id,
      });
      return;
    }

    next();
  };

/** Buckets an authenticated user, falling back to IP for anonymous requests. */
export const byUserOrIp = (req: Request): string => {
  const userId = (req as Request & { user?: { id?: string } }).user?.id;
  return userId ? `user:${userId}` : `ip:${req.ip ?? 'unknown'}`;
};

/** Test/maintenance hook: clears all counters. */
export const resetRateLimits = (): void => buckets.clear();
