import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { validationError } from '../utils/api-response';

/**
 * Runs after a route's express-validator chain. If any validation failed it
 * responds with the standard validation-error envelope; otherwise it passes
 * control to the controller.
 */
export function validate(req: Request, res: Response, next: NextFunction): Response | void {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((err) => ({
    // FieldValidationError exposes `path`; fall back gracefully for others.
    field: (err as { path?: string; param?: string }).path ?? (err as { param?: string }).param ?? 'unknown',
    message: err.msg as string,
  }));

  return validationError(res, errors);
}
