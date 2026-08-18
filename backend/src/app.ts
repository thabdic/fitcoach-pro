import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';

/**
 * Build and configure the Express application.
 *
 * Order matters: parsers → API routes → 404 → error handler (last).
 */
export function createApp(): Application {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // All API routes are mounted under /api via the central router.
  app.use('/api', apiRouter);

  // 404 for unmatched routes, then the central error handler.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
