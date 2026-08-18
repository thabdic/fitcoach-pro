import { test as base } from '@playwright/test';
import { RequestHandler } from './request-handler';
import { BACKEND_URL } from '../../e2e/config/credentials';

export type TestOptions = {
  api: RequestHandler;
};

/**
 * Gives every API test a ready RequestHandler. The base URL comes from
 * credentials.ts (BACKEND_URL, env-overridable) — the same single source of
 * truth the e2e suite uses, so the host is never typed twice.
 */
export const test = base.extend<TestOptions>({
  api: async ({ request }, use) => {
    await use(new RequestHandler(request, BACKEND_URL));
  },
});
