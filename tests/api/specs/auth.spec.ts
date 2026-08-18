import { expect } from '@playwright/test';
import { test } from '../utils/fixtures';
import { registerUser, uniqueEmail } from '../utils/auth';
import { ACCOUNTS, TEST_PASSWORD } from '../../e2e/config/credentials';

/**
 * API-AUTH — registration, login and identity. The front door: every other spec
 * depends on getting a token, so this file proves that first.
 *
 * Registration tests create their own throwaway users (unique emails), so this
 * file mutates nothing the e2e suite reads. Seeded accounts are only ever
 * logged in, never modified.
 */

test('registers a new client and returns a usable token', async ({ api }) => {
  const email = uniqueEmail('client');

  const res = await api
    .path('/auth/register')
    .body({ name: 'New Client', email, password: TEST_PASSWORD, role: 'client' })
    .postRequest(201);

  expect(res.success).toBe(true);
  expect(res.data.user.email).toEqual(email);
  expect(res.data.user.role).toEqual('client');
  expect(res.data.user.isActive).toBe(true);
  expect(typeof res.data.token).toBe('string');
  expect(res.data.user).not.toHaveProperty('passwordHash');
  expect(JSON.stringify(res)).not.toContain('passwordHash');
});

test('registers a new trainer', async ({ api }) => {
  const email = uniqueEmail('trainer');

  const res = await api
    .path('/auth/register')
    .body({ name: 'New Trainer', email, password: TEST_PASSWORD, role: 'trainer' })
    .postRequest(201);

  expect(res.data.user.role).toEqual('trainer');
});

test('defaults a role-less registration to client', async ({ api }) => {
  const res = await api
    .path('/auth/register')
    .body({ name: 'No Role', email: uniqueEmail('norole'), password: TEST_PASSWORD })
    .postRequest(201);

  expect(res.data.user.role).toEqual('client');
});

test('refuses to self-register as admin', async ({ api }) => {
  const res = await api
    .path('/auth/register')
    .body({ name: 'Sneaky', email: uniqueEmail('admin'), password: TEST_PASSWORD, role: 'admin' })
    .postRequest(422);

  expect(res.message).toEqual('Validation failed');
  expect(res.errors?.map((e) => e.field)).toContain('role');
});

test('rejects a password shorter than 8 characters', async ({ api }) => {
  const res = await api
    .path('/auth/register')
    .body({ name: 'Short', email: uniqueEmail('short'), password: 'abc' })
    .postRequest(422);

  expect(res.errors?.map((e) => e.field)).toContain('password');
});

test('rejects an email that is already registered', async ({ api }) => {
  const existing = await registerUser(api, 'client');

  const res = await api
    .path('/auth/register')
    .body({ name: 'Duplicate', email: existing.email, password: TEST_PASSWORD, role: 'client' })
    .postRequest(409);

  expect(res.message).toEqual('An account with this email already exists');
});

test('logs in each seeded role and returns that role', async ({ api }) => {
  for (const account of [ACCOUNTS.admin, ACCOUNTS.trainer, ACCOUNTS.client]) {
    const res = await api
      .path('/auth/login')
      .body({ email: account.email, password: account.password })
      .postRequest(200);

    expect(res.data.user.email).toEqual(account.email);
    expect(res.data.user.role).toEqual(account.role);
    expect(typeof res.data.token).toBe('string');
  }
});

test('rejects a wrong password without revealing which field was wrong', async ({ api }) => {
  const res = await api
    .path('/auth/login')
    .body({ email: ACCOUNTS.client.email, password: 'WrongPassword123!' })
    .postRequest(401);

  expect(res.message).toEqual('Invalid email or password');
});

test('rejects an unknown email with the same message as a wrong password', async ({ api }) => {
  const res = await api
    .path('/auth/login')
    .body({ email: uniqueEmail('nobody'), password: TEST_PASSWORD })
    .postRequest(401);

  expect(res.message).toEqual('Invalid email or password');
});

test('returns the caller identity for a valid token', async ({ api }) => {
  const user = await registerUser(api, 'client');

  const res = await api.path('/auth/me').token(user.token).getRequest(200);

  expect(res.data.user._id).toEqual(user.id);
  expect(res.data.user.email).toEqual(user.email);
  expect(res.data.user).not.toHaveProperty('passwordHash');
});

test('rejects /auth/me without a token', async ({ api }) => {
  const res = await api.path('/auth/me').getRequest(401);

  expect(res.success).toBe(false);
  expect(res.message).toEqual('Authentication required');
});

test('rejects a malformed token', async ({ api }) => {
  const res = await api.path('/auth/me').token('not-a-real-jwt').getRequest(401);

  expect(res.message).toEqual('Invalid or expired token');
});
