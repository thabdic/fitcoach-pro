import { Response } from 'express';

/**
 * Standard success envelope: { success: true, data }
 */
export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data });
}

/**
 * Standard error envelope: { success: false, message }
 */
export function fail(res: Response, message: string, status = 400): Response {
  return res.status(status).json({ success: false, message });
}

/** A single field-level validation problem. */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Validation error envelope:
 * { success: false, message, errors: [{ field, message }] }
 */
export function validationError(
  res: Response,
  errors: FieldError[],
  message = 'Validation failed',
  status = 422,
): Response {
  return res.status(status).json({ success: false, message, errors });
}
