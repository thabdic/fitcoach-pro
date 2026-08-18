import mongoose from 'mongoose';
import { env } from './env';

/**
 * Establish the MongoDB connection. Called once on server start.
 */
export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log(`[db] Connected to MongoDB at ${env.mongoUri}`);
}
