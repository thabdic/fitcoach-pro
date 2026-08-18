import { expect } from '@playwright/test';
import { test } from '../utils/fixtures';
import { registerUser } from '../utils/auth';
import { validProfile } from '../utils/data';

/**
 * Endpoints (profile.routes.ts, all behind requireAuth):
 *   GET  /profile/me   -> 200 { profile } | 404 'Profile not found. Create one first.'
 *   POST /profile      -> 201 { profile } | 409 'A profile already exists. Use PUT /api/profile/me to update it.'
 *   PUT  /profile/me   -> 200 { profile } | 404 (same message as GET)
 */

test('has no profile before one is created', async ({ api }) => {
  const registeredUser = await registerUser(api,'client');
  const res = await api.path('/profile/me').token(registeredUser.token).getRequest(404);
  expect(res.message).toEqual('Profile not found. Create one first.')

});

test('creates a profile for the caller', async ({ api }) => {
  const registeredUser = await registerUser(api, 'client');
    const payload = { ...validProfile, injuries: 'none', dietaryPreference: 'high protein' };
    const created = await api.path('/profile').token(registeredUser.token).body(payload).postRequest(201);
    expect(created.data.profile.userId).toEqual(registeredUser.id);
    const fetched = await api.path('/profile/me').token(registeredUser.token).getRequest(200);
    expect(fetched.data.profile).toMatchObject(payload);
    expect(fetched.data.profile._id).toEqual(created.data.profile._id);
});

test('refuses a second profile for the same user', async ({ api }) => {
    const registeredUser = await registerUser(api, 'client');
    const payload = { ...validProfile, injuries: 'none', dietaryPreference: 'high protein' };
    const differentPayload = { ...validProfile, injuries: 'knee cap injury', weightKg: 90 };

    await api.path('/profile').token(registeredUser.token).body(payload).postRequest(201);

    const rejected = await api
      .path('/profile')
      .token(registeredUser.token)
      .body(differentPayload)
      .postRequest(409);

    expect(rejected.message).toEqual('A profile already exists. Use PUT /api/profile/me to update it.');
});

test('updates the profile partially', async ({ api }) => {
  const registeredUser = await registerUser(api, 'client');
    const payload = { ...validProfile, injuries: 'none', dietaryPreference: 'high protein' };
    await api.path('/profile').token(registeredUser.token).body(payload).postRequest(201);
    await api.path('/profile/me').token(registeredUser.token).body({ weightKg: 92 }).putRequest(200);
    const newProfile = await api.path('/profile/me').token(registeredUser.token).getRequest(200);
    expect(newProfile.data.profile).toMatchObject({ ...payload, weightKg: 92 });
});

test('cannot update a profile that does not exist yet', async ({ api }) => {
  const registeredUser = await registerUser(api, 'client');
  const res = await api.path('/profile/me').token(registeredUser.token).body({ weightKg: 92 }).putRequest(404);
  expect(res.message).toEqual('Profile not found. Create one first.');
});

test('rejects a goal outside the allowed list', async ({ api }) => {
  const registeredUser = await registerUser(api, 'client');
  const payload = { ...validProfile, goal: 'get rich' };
  const rejected = await api.path('/profile').token(registeredUser.token).body(payload).postRequest(422);
  expect(rejected.errors?.map((e) => e.field)).toContain('goal');
});

test('rejects an out-of-range age', async ({ api }) => {
  const registeredUser = await registerUser(api, 'client');
  const payload = { ...validProfile,  age:5};
  const rejected = await api.path('/profile').token(registeredUser.token).body(payload).postRequest(422);
  expect(rejected.errors?.map((e) => e.field)).toContain('age');
});

test('requires authentication', async ({ api }) => {
  const res = await api.path('/profile/me').getRequest(401);
  expect(res.message).toEqual('Authentication required');
});

test('never returns another user\'s profile', async ({ api }) => {
  const registeredUser1 = await registerUser(api,'client');
  const registeredUser2 = await registerUser(api,'client');
  const payloadUser1 = { ...validProfile, injuries: 'none', dietaryPreference: 'high protein' };
  const payloadUser2 = { ...validProfile, injuries: 'damaged knee', dietaryPreference: 'low sugar diet'};
  await api.path('/profile').token(registeredUser1.token).body(payloadUser1).postRequest(201);
  await api.path('/profile').token(registeredUser2.token).body(payloadUser2).postRequest(201)
  const fetchedUser1 = await api.path('/profile/me').token(registeredUser1.token).getRequest(200);
  const fetchedUser2 = await api.path('/profile/me').token(registeredUser2.token).getRequest(200);
  expect(fetchedUser1.data.profile).toMatchObject({ ...payloadUser1, userId: registeredUser1.id });
  expect(fetchedUser2.data.profile).toMatchObject({ ...payloadUser2, userId: registeredUser2.id });
});
