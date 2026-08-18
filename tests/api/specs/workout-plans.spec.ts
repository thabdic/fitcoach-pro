import { expect } from '@playwright/test';
import { test } from '../utils/fixtures';
import { loginAs, RegisteredUser, registerUser } from '../utils/auth';
import { createLinkedPair } from '../utils/setup';
import { validWorkoutPlan } from '../utils/data';
import { ACCOUNTS } from '../../e2e/config/credentials';

/**
 * Endpoints (workout-plan.routes.ts, all behind requireAuth):
 *   GET    /workout-plans      admin=all · trainer={trainerId:me} · client=own AND status 'assigned' only
 *   POST   /workout-plans      requireRole('trainer','admin'); a trainer's trainerId is forced to self
 *   GET    /workout-plans/:id  canViewPlan, else 403 'You do not have permission to access this plan'
 *   PUT    /workout-plans/:id  admin or the assigned trainer; clientId/trainerId are immutable
 *   DELETE /workout-plans/:id  requireRole('admin') — ADMIN ONLY, by design
 */

let adminToken: string;

test.beforeAll(async ({ api }) => {
  adminToken = await loginAs(api, ACCOUNTS.admin);
});

test('a trainer creates a plan for a linked client', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  const createdPlan = await api.path('/workout-plans')
  .token(trainer.token)
  .body(validWorkoutPlan(client.id))
  .postRequest(201)
  expect(createdPlan.data.plan.clientId).toEqual(client.id);
  expect(createdPlan.data.plan.trainerId).toEqual(trainer.id);
});

test('a trainer cannot create a plan for a client who is not theirs', async ({ api }) => {
  const clientUser = await registerUser(api, 'client');
  const trainerUser = await registerUser(api, 'trainer');
  const createdPlan = await api.path('/workout-plans')
  .token(trainerUser.token)
  .body(validWorkoutPlan(clientUser.id))
  .postRequest(403);
  expect(createdPlan.message).toEqual('You can only create plans for clients assigned to you')
});

test('a trainer cannot forge the trainerId', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  const otherTrainer = await registerUser(api,'trainer')
  const createdPlan = await api.path('/workout-plans')
  .token(trainer.token)
  .body({...validWorkoutPlan(client.id),trainerId:otherTrainer.id})
  .postRequest(201)
  expect(createdPlan.data.plan.trainerId).toEqual(trainer.id);
});

test('a client cannot create a plan', async ({ api }) => {
   const clientUser = await registerUser(api, 'client');
   const rejectedPlan = await api.path('/workout-plans')
  .token(clientUser.token)
  .body(validWorkoutPlan(clientUser.id))
  .postRequest(403);
  expect(rejectedPlan.message).toEqual('You do not have permission to access this resource');
  const list = await api.path('/workout-plans').token(clientUser.token).getRequest(200);
  expect(list.data.plans).toHaveLength(0);
});

test('an admin can create a plan for any client', async ({ api }) => {
  const clientUser = await registerUser(api, 'client');
  const trainerUser = await registerUser(api, 'trainer');
  const createdPlan = await api.path('/workout-plans')
  .token(adminToken)
  .body({...validWorkoutPlan(clientUser.id),trainerId:trainerUser.id})
  .postRequest(201)
  expect(createdPlan.data.plan.trainerId).toEqual(trainerUser.id);
   expect(createdPlan.data.plan.clientId).toEqual(clientUser.id);
});

test('a clientId pointing at a non-client is rejected', async ({ api }) => {
  const trainerUser = await registerUser(api, 'trainer');
  const rejectedPlan = await api.path('/workout-plans')
  .token(adminToken)
  .body(validWorkoutPlan(trainerUser.id))
  .postRequest(400)
  expect(rejectedPlan.message).toEqual('clientId must reference a user with the client role');
});

test('a client sees assigned plans but never drafts', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  await api.path('/workout-plans')
  .token(trainer.token)
  .body(validWorkoutPlan(client.id))
  .postRequest(201);
  await api.path('/workout-plans')
  .token(trainer.token)
  .body({...validWorkoutPlan(client.id),status:'draft'})
  .postRequest(201);
  const list = await api.path('/workout-plans').token(client.token).getRequest(200);
  expect(list.data.plans).toHaveLength(1);
});

test('a trainer sees only their own plans', async ({ api }) => {
  const pair1 = await createLinkedPair(api, adminToken);
  const pair2 = await createLinkedPair(api, adminToken);
  const workouPlan1 = await api.path('/workout-plans')
  .token(pair1.trainer.token)
  .body(validWorkoutPlan(pair1.client.id))
  .postRequest(201);
  const workouPlan2 = await api.path('/workout-plans')
  .token(pair2.trainer.token)
  .body(validWorkoutPlan(pair2.client.id))
  .postRequest(201);
  const list1 = await api.path('/workout-plans').token(pair1.trainer.token).getRequest(200);
  const list2 = await api.path('/workout-plans').token(pair2.trainer.token).getRequest(200);
  const ids1 = list1.data.plans.map((p: any) => p._id);
  expect(ids1).toContain(workouPlan1.data.plan._id);
  expect(ids1).not.toContain(workouPlan2.data.plan._id);
  expect(list1.data.plans).toHaveLength(1);
  expect(list2.data.plans).toHaveLength(1);
});

test('an unrelated client cannot read a plan by id', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  const createdPlan = await api.path('/workout-plans')
  .token(trainer.token)
  .body(validWorkoutPlan(client.id))
  .postRequest(201);
  const clientUser = await registerUser(api, 'client');
  const denied = await api.path(`/workout-plans/${createdPlan.data.plan._id}`).token(clientUser.token).getRequest(403);
  expect(denied.message).toEqual('You do not have permission to access this plan');
});

test('the assigned trainer updates a plan', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  const createdPlan = await api.path('/workout-plans')
  .token(trainer.token)
  .body(validWorkoutPlan(client.id))
  .postRequest(201);
  const updatedPlan = await api.path(`/workout-plans/${createdPlan.data.plan._id}`)
    .token(trainer.token)
    .body({ title: 'Updated Strength training' })
    .putRequest(200);
  expect(updatedPlan.data.plan.title).toEqual('Updated Strength training');
  expect(updatedPlan.data.plan.difficulty).toEqual('beginner');
});

test('clientId cannot be reassigned through an update', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  const createdPlan = await api.path('/workout-plans')
  .token(trainer.token)
  .body(validWorkoutPlan(client.id))
  .postRequest(201);
  const clientUser = await registerUser(api, 'client');
  const updatedPlan = await api.path(`/workout-plans/${createdPlan.data.plan._id}`)
    .token(trainer.token)
    .body({ title: 'Updated Strength training',clientId:clientUser.id })
    .putRequest(200);
    expect(updatedPlan.data.plan.title).toEqual('Updated Strength training');
    expect(updatedPlan.data.plan.clientId).toEqual(client.id)
});

test('an unassigned trainer cannot update a plan', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  const createdPlan = await api.path('/workout-plans')
  .token(trainer.token)
  .body(validWorkoutPlan(client.id))
  .postRequest(201);
  const unassignedTrainer = await registerUser(api, 'trainer');
  const updatedPlan = await api.path(`/workout-plans/${createdPlan.data.plan._id}`)
    .token(unassignedTrainer.token)
    .body({ title: 'Updated Strength training'})
    .putRequest(403);
  expect(updatedPlan.message).toEqual('You do not have permission to update this plan');
  const reread = await api.path(`/workout-plans/${createdPlan.data.plan._id}`)
    .token(trainer.token)
    .getRequest(200);
  expect(reread.data.plan.title).toEqual(createdPlan.data.plan.title);
});

test('a trainer cannot delete a plan', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  const createdPlan = await api.path('/workout-plans')
  .token(trainer.token)
  .body(validWorkoutPlan(client.id))
  .postRequest(201);
  const rejectedDelete = await api.path(`/workout-plans/${createdPlan.data.plan._id}`).token(trainer.token).deleteRequest(403);
  expect(rejectedDelete.message).toEqual('You do not have permission to access this resource');
  const list = await api.path('/workout-plans').token(client.token).getRequest(200);
  expect(list.data.plans).toHaveLength(1);
});

test('an admin deletes a plan', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  const createdPlan = await api.path('/workout-plans')
  .token(trainer.token)
  .body(validWorkoutPlan(client.id))
  .postRequest(201);
  const deletedPlan = await api.path(`/workout-plans/${createdPlan.data.plan._id}`).token(adminToken).deleteRequest(200);
  expect(deletedPlan.data.message).toEqual('Workout plan deleted');
  const list = await api.path(`/workout-plans/${createdPlan.data.plan._id}`).token(client.token).getRequest(404);
  expect(list.message).toEqual('Workout plan not found');
  expect(deletedPlan.data.id).toEqual(createdPlan.data.plan._id);
});

test('an invalid difficulty is rejected', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  const rejectedPlan = await api.path('/workout-plans')
  .token(trainer.token)
  .body({...validWorkoutPlan(client.id),difficulty:'extreme'})
  .postRequest(422);
  expect(rejectedPlan.errors?.map((e) => e.field)).toContain('difficulty');
});

test('daysPerWeek outside 1-7 is rejected', async ({ api }) => {
  const {trainer,client} = await createLinkedPair(api,adminToken);
  const rejectedPlan = await api.path('/workout-plans')
  .token(trainer.token)
  .body({...validWorkoutPlan(client.id),daysPerWeek:9})
  .postRequest(422);
  expect(rejectedPlan.errors?.map((e) => e.field)).toContain('daysPerWeek');
});
