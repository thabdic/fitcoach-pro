import { expect } from '@playwright/test';
import { test } from '../utils/fixtures';
import { loginAs, registerUser } from '../utils/auth';
import { ACCOUNTS } from '../../e2e/config/credentials';
import { createLinkedPair } from '../utils/setup';

/**
 * Endpoints (plan-request.routes.ts, all behind requireAuth):
 *   GET   /plan-requests            role-scoped: admin=all, trainer={trainerId:me}, client={clientId:me}
 *   POST  /plan-requests            requireRole('client'); clientId forced to req.user.id
 *   GET   /plan-requests/:id        admin | owner client | assigned trainer, else 403
 *   PATCH /plan-requests/:id/assign requireRole('admin'); also moves pending -> assigned
 *   PATCH /plan-requests/:id/status admin or the ASSIGNED trainer; clients never
 */

let adminToken: string;

test.beforeAll(async ({ api }) => {
  adminToken = await loginAs(api, ACCOUNTS.admin);
});

test('a client creates a request that starts as pending', async ({ api }) => {
    const client = await registerUser(api, 'client');
    const payload = { goal: 'Decrease body fat' };
    const created = await api.path('/plan-requests').token(client.token).body(payload).postRequest(201);
    expect(created.data.request).toMatchObject({ ...payload, clientId: client.id, status: 'pending' });
    expect(created.data.request.trainerId).toBeUndefined();
    const list = await api.path('/plan-requests').token(client.token).getRequest(200);
    expect(list.data.requests).toHaveLength(1);
    expect(list.data.requests[0]).toMatchObject({ clientId: client.id, status: 'pending' });
});

test('the clientId in the body is ignored', async ({ api }) => {
  const clientA = await registerUser(api, 'client');
  const clientB = await registerUser(api, 'client');
  const created = await api
      .path('/plan-requests')
      .token(clientA.token)
      .body({ goal: 'Increase muscle mass', clientId: clientB.id })
      .postRequest(201);
  expect(created.data.request.clientId).toEqual(clientA.id);

  const listB = await api.path('/plan-requests').token(clientB.token).getRequest(200);
  expect(listB.data.requests).toHaveLength(0);
});

test('a trainer cannot create a request', async ({ api }) => {
  const trainer = await registerUser(api,'trainer');
  const payload = { goal: 'Decrease body fat' };
  const rejectedPlan = await api.path('/plan-requests').token(trainer.token).body(payload).postRequest(403);
  expect(rejectedPlan.message).toEqual('You do not have permission to access this resource');
});

test('a request with no goal is rejected', async ({ api }) => {
  const client = await registerUser(api, 'client');
  const payload = { goal: '   ' };
  const rejectedPlan = await api.path('/plan-requests').token(client.token).body(payload).postRequest(422);
  expect(rejectedPlan.errors?.map((e) => e.field)).toContain('goal');
});

test('an admin assigns a trainer, moving the request to assigned', async ({ api }) => {
  const trainer = await registerUser(api, 'trainer');
  const client = await registerUser(api, 'client');

    const created = await api
      .path('/plan-requests')
      .token(client.token)
      .body({ goal: 'Decrease body fat' })
      .postRequest(201);
    const requestId = created.data.request._id;
    const assigned = await api
      .path(`/plan-requests/${requestId}/assign`)
      .token(adminToken)
      .body({ trainerId: trainer.id })
      .patchRequest(200);
    expect(assigned.data.request.trainerId).toEqual(trainer.id);
    expect(assigned.data.request.status).toEqual('assigned');

    const list = await api.path('/plan-requests').token(client.token).getRequest(200);
    expect(list.data.requests[0]).toMatchObject({ trainerId: trainer.id, status: 'assigned' });
});

test('assigning a non-trainer is rejected', async ({ api }) => {
   const client = await registerUser(api, 'client');
   const client2 = await registerUser(api, 'client');
    const created = await api
      .path('/plan-requests')
      .token(client.token)
      .body({ goal: 'Decrease body fat' })
      .postRequest(201);
    const requestId = created.data.request._id;
    const rejected = await api
      .path(`/plan-requests/${requestId}/assign`)
      .token(adminToken)
      .body({ trainerId: client2.id })
      .patchRequest(400);
    expect(rejected.message).toEqual('trainerId must reference a user with the trainer role')
});

test('a trainer cannot assign', async ({ api }) => {
  const trainer = await registerUser(api, 'trainer');
  const client = await registerUser(api, 'client');

    const created = await api
      .path('/plan-requests')
      .token(client.token)
      .body({ goal: 'Decrease body fat' })
      .postRequest(201);
    const requestId = created.data.request._id;
    const rejected = await api
      .path(`/plan-requests/${requestId}/assign`)
      .token(trainer.token)
      .body({ trainerId: trainer.id })
      .patchRequest(403);
      expect(rejected.message).toEqual('You do not have permission to access this resource');
});

test('the assigned trainer moves the request to in progress', async ({ api }) => {
  const { trainer, client, requestId } = await createLinkedPair(api, adminToken);

    const inProgress = await api
      .path(`/plan-requests/${requestId}/status`)
      .token(trainer.token)
      .body({ status: 'in_progress' })
      .patchRequest(200);
    expect(inProgress.data.request.status).toEqual('in_progress');

    const list = await api.path('/plan-requests').token(client.token).getRequest(200);
    expect(list.data.requests[0]).toMatchObject({ trainerId: trainer.id, status: 'in_progress' });
});

test('an unassigned trainer cannot change the status', async ({ api }) => {
  const { trainer, client, requestId } = await createLinkedPair(api, adminToken);
  const trainerB = await registerUser(api, 'trainer');
  const rejected = await api
      .path(`/plan-requests/${requestId}/status`)
      .token(trainerB.token)
      .body({ status: 'in_progress' })
      .patchRequest(403);
      expect(rejected.message).toEqual('You do not have permission to update this request')
  const list = await api.path('/plan-requests').token(client.token).getRequest(200);
  expect(list.data.requests[0]).toMatchObject({ trainerId: trainer.id, status: 'assigned' });
});

test('a client cannot change the status of their own request', async ({ api }) => {
  const { trainer, client, requestId } = await createLinkedPair(api, adminToken);
  const rejected = await api
      .path(`/plan-requests/${requestId}/status`)
      .token(client.token)
      .body({ status: 'in_progress' })
      .patchRequest(403);
      expect(rejected.message).toEqual('You do not have permission to update this request');
      const list = await api.path('/plan-requests').token(client.token).getRequest(200);
      expect(list.data.requests[0]).toMatchObject({ trainerId: trainer.id, status: 'assigned' });
});

test('an illegal status jump is rejected', async ({ api }) => {
    const client = await registerUser(api, 'client');
    const created = await api
      .path('/plan-requests')
      .token(client.token)
      .body({ goal: 'Decrease body fat' })
      .postRequest(201);
    const requestId = created.data.request._id;

    const rejected = await api
      .path(`/plan-requests/${requestId}/status`)
      .token(adminToken)
      .body({ status: 'completed' })
      .patchRequest(400);
    expect(rejected.message).toEqual('Cannot change status from pending to completed');
    const list = await api.path('/plan-requests').token(client.token).getRequest(200);
    expect(list.data.requests[0]).toMatchObject({ status: 'pending' });
});

test('a completed request is terminal', async ({ api }) => {
  const { trainer, client, requestId } = await createLinkedPair(api, adminToken);
  const trainerB = await registerUser(api, 'trainer');
    const inProgress = await api
      .path(`/plan-requests/${requestId}/status`)
      .token(trainer.token)
      .body({ status: 'in_progress' })
      .patchRequest(200);
    expect(inProgress.data.request.status).toEqual('in_progress');

    const list = await api.path('/plan-requests').token(client.token).getRequest(200);
    expect(list.data.requests[0]).toMatchObject({ trainerId: trainer.id, status: 'in_progress' });
    const completedPlan = await api
      .path(`/plan-requests/${requestId}/status`)
      .token(trainer.token)
      .body({ status: 'completed' })
      .patchRequest(200);
    expect(completedPlan.data.request.status).toEqual('completed');
    const noStatus = await api
      .path(`/plan-requests/${requestId}/status`)
      .token(trainer.token)
      .body({ status: 'in_progress' })
      .patchRequest(400);
    expect(noStatus.message).toEqual('Cannot change status from completed to in_progress');
    const rejected = await api
      .path(`/plan-requests/${requestId}/assign`)
      .token(adminToken)
      .body({ trainerId: trainerB.id })
      .patchRequest(400);
    expect(rejected.message).toEqual('Cannot assign a trainer to a completed request');
});

test('a client sees only their own requests', async ({ api }) => {
  const clientA = await registerUser(api, 'client');
  const clientB = await registerUser(api, 'client');
  const createdPlanClientA = await api
      .path('/plan-requests')
      .token(clientA.token)
      .body({ goal: 'Decrease body fat' })
      .postRequest(201);
  const createdPlanClientB = await api
      .path('/plan-requests')
      .token(clientB.token)
      .body({ goal: 'Increase muscle mass' })
      .postRequest(201);
  const listClientA = await api.path('/plan-requests').token(clientA.token).getRequest(200);
  expect(listClientA.data.requests).toHaveLength(1);
  expect(listClientA.data.requests[0]).toMatchObject({ clientId: clientA.id, status: 'pending' });
  const listClientB = await api.path('/plan-requests').token(clientB.token).getRequest(200);
  expect(listClientB.data.requests).toHaveLength(1);
  expect(listClientB.data.requests[0]).toMatchObject({ clientId: clientB.id, status: 'pending' });
});

test('an unrelated user cannot read a request by id', async ({ api }) => {
  const clientA = await registerUser(api, 'client');
  const clientB = await registerUser(api, 'client');
  const createdPlanClientA = await api
      .path('/plan-requests')
      .token(clientA.token)
      .body({ goal: 'Increase muscle mass' })
      .postRequest(201);
  const requestId = createdPlanClientA.data.request._id;
  const rejected = await api.path(`/plan-requests/${requestId}`).token(clientB.token).getRequest(403);
  expect(rejected.message).toEqual('You do not have permission to access this request');

});

test('a malformed id is a validation error', async ({ api }) => {
  const { trainer, client, requestId } = await createLinkedPair(api, adminToken);
  const incorrectObjectId = 'gdfhgfhdg54734';
  const rejected = await api
    .path(`/plan-requests/${incorrectObjectId}/status`)
    .token(trainer.token)
    .body({ status: 'in_progress' })
    .patchRequest(422);
  expect(rejected.message).toEqual('Validation failed');
  expect(rejected.errors).toContainEqual({ field: 'id', message: 'Invalid plan request id' });
});
