import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000/api';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:4200';

export default defineConfig({
  fullyParallel: true,
  reporter: 'html',
  expect: { timeout: 20_000 },
  projects: [
    {
      name: 'api',
      testDir: './api/specs',
      // The reseed must finish BEFORE any API test starts: `npm run seed` does
      // User.deleteMany({}) (seed.ts:41-48), so a reseed landing mid-run would
      // delete the throwaway users these tests register for themselves.
      // This does not serialise api against e2e — both simply start after the
      // single reseed, which is safe because API tests only assert on records
      // they created (or on seeded accounts they merely log in as).
      dependencies: ['db'],
      use: {
        baseURL: BACKEND_URL,
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
      },
    },
    {
      name:'db',
      testDir:'e2e/setup',
      testMatch:/reseed\.setup\.ts/,
    },
    {
      name:'setup',
      testDir:'./e2e/setup',
      testMatch: /auth\.setup\.ts/,
      dependencies: ['db'],
    },
    {
      name: 'e2e',
      testDir: './e2e/specs',
      dependencies:['setup'],
      use: {
        baseURL: FRONTEND_URL,
        screenshot: { mode: 'only-on-failure', fullPage: true },
        trace: 'retain-on-failure',
        launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
      },
    },
  ],
});