import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Baseline security headers for a JSON API. The Next.js app sets its own
 * document-level policy in next.config.mjs.
 */
export const securityHeaders = () => (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // API responses are per-user and must never be cached by intermediaries.
  res.setHeader('Cache-Control', 'no-store');

  if (env.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};
