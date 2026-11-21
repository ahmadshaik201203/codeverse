import { Request, Response, NextFunction } from 'express';

/** Error carrying an HTTP status, a stable machine code and optional field details. */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, 'BAD_REQUEST', message, details);

export const unauthorized = (message = 'Authentication required.') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const forbidden = (message = 'You do not have permission to perform this action.') =>
  new AppError(403, 'FORBIDDEN', message);

export const notFoundError = (message = 'Resource not found.') =>
  new AppError(404, 'NOT_FOUND', message);

export const serviceUnavailable = (code: string, message: string) =>
  new AppError(503, code, message);

/** 404 handler for unmatched API routes. */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist.' },
    requestId: req.id,
  });
};

interface ErrorShape {
  name?: string;
  code?: string | number;
  status?: number;
  message?: string;
  stack?: string;
}

/**
 * Single terminal error handler. Never leaks stack traces or driver internals;
 * logs the details server-side against the request id only.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (res.headersSent) return;

  const error = (err ?? {}) as ErrorShape;

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred.';
  let details: unknown;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (error.name === 'ValidationError') {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'The submitted data is invalid.';
  } else if (error.name === 'CastError') {
    status = 400;
    code = 'INVALID_IDENTIFIER';
    message = 'The provided identifier is malformed.';
  } else if (error.code === 11000) {
    status = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'That record already exists.';
  } else if ((err as { type?: string }).type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'The request payload is too large.';
  } else if ((err as { type?: string }).type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'The request body is not valid JSON.';
  }

  if (status >= 500) {
    console.error(
      JSON.stringify({
        level: 'error',
        requestId: req.id,
        method: req.method,
        path: req.path,
        name: error.name ?? 'Error',
        message: error.message ?? 'unknown',
      })
    );
  }

  res.status(status).json({
    error: { code, message, ...(details !== undefined ? { details } : {}) },
    requestId: req.id,
  });
};

/** Wraps async handlers so rejected promises reach the error middleware. */
export const asyncHandler =
  <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
