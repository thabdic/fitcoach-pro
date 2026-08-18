import { RequestHandler } from './request-handler';
import { TestAccount, TEST_PASSWORD } from '../../e2e/config/credentials';

/**
 * Two ways an API test gets a token.
 *
 * `loginAs` — for the four SEEDED accounts. Safe to call while the e2e suite is
 * running: JWTs here are stateless (no session store, no token blacklist), so
 * logging in twice as the same user does not invalidate anything.
 *
 * `registerUser` — for everything a test intends to MUTATE. A test that works on
 * its own throwaway user cannot disturb the seeded data the e2e specs assert on,
 * and cannot be disturbed by them. `/auth/register` accepts client|trainer only
 * (admin is blocked, auth.routes.ts:19-22), so admin work still uses loginAs.
 */

export interface RegisteredUser {
  token: string;
  id: string;
  email: string;
}

/** Unique so re-runs never collide on the unique-email constraint. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}@fitcoach.test`;
}

export async function loginAs(api: RequestHandler, account: TestAccount): Promise<string> {
  const res = await api
    .path('/auth/login')
    .body({ email: account.email, password: account.password })
    .postRequest(200);
  return res.data.token;
}

export async function registerUser(api: RequestHandler, role: 'client' | 'trainer'): Promise<RegisteredUser> {
  const email = uniqueEmail(role);
  const res = await api
    .path('/auth/register')
    .body({ name: `Test ${role}`, email, password: TEST_PASSWORD, role })
    .postRequest(201);
  return { token: res.data.token, id: res.data.user._id, email };
}
