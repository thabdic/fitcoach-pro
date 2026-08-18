import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized, typed access to environment variables.
 * Keep all process.env reads here so the rest of the app stays clean.
 */
export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitcoach_pro',
  jwtSecret: process.env.JWT_SECRET || 'change-me-to-a-long-random-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
};
