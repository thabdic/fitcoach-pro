import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

/**
 * Boot the HTTP server after the database connection is established.
 */
async function start(): Promise<void> {
  try {
    await connectDB();
    const app = createApp();
    app.listen(env.port, () => {
      console.log(`[server] FitCoach Pro API listening on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();
