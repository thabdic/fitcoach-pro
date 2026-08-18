import { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/api-response';
import { env } from '../config/env';

/**
 * Operational error carrying an HTTP status. Controllers/services throw this
 * (or call next(new AppError(...))) and the central handler turns it into a
 * clean error response.
 */
export class AppError extends Error {
  public readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

/**
 * 404 handler — reached when no route matched. Must be registered after all
 * routes and before the error handler.
 */
export function notFound(req: Request, res: Response): Response {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

/**
 * Central error handler. Must keep the 4-argument signature so Express treats
 * it as an error-handling middleware. Always responds with the standard
 * error envelope.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): Response {
  const status =
    err instanceof AppError
      ? err.status
      : typeof (err as { status?: number })?.status === 'number'
        ? (err as { status: number }).status
        : 500;

  const rawMessage = err instanceof Error ? err.message : 'Internal server error';
  // Hide internal details for 5xx in production; keep them in development.
  const message =
    status >= 500 && env.nodeEnv === 'production' ? 'Internal server error' : rawMessage;

  if (status >= 500) {
    console.error('[error]', err);
  }

  return fail(res, message, status);
}
