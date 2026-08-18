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
      //
      // It is NOT safe to run the two projects in ONE invocation, though: the
      // api specs register throwaway users, and the users table paginates at 10
      // rows with no filter (users.html:11), so those extra rows push the seeded
      // accounts off page 1 and admin-flow can no longer find them. Run them as
      // two invocations instead — `npm test` does, and each one re-runs the
      // reseed, so e2e starts from a clean baseline. Do not add
      // `dependencies: ['e2e']` here to force the order: a dependency failure
      // SKIPS the dependent project, so one flaky e2e test would silently hide
      // all of the api results, and every `test:api*` script would drag the full
      // e2e suite in first.
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