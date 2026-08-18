import { Request, Response, Router } from 'express';
import { ok } from '../utils/api-response';
import { env } from '../config/env';

export const healthRoutes = Router();

// GET /api/health — confirms the server is up.
healthRoutes.get('/', (_req: Request, res: Response) => {
  ok(res, { status: 'ok', service: 'fitcoach-pro-backend', env: env.nodeEnv });
});
