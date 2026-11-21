import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/** Assigns a request id and echoes it so clients can correlate failures. */
export const requestId = () => (req: Request, res: Response, next: NextFunction): void => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

/**
 * Structured access log. Deliberately logs only method, path (no query string),
 * status, duration and pseudonymous user id — never headers, bodies or cookies,
 * so tokens, passwords and API keys cannot reach the log.
 */
export const requestLog = () => (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    console.log(
      JSON.stringify({
        level: 'info',
        requestId: req.id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 10) / 10,
        userId: (req as AuthRequest).user?.id ?? null,
        ip: req.ip ?? null,
      })
    );
  });

  next();
};
