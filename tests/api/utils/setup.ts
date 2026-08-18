import { RequestHandler } from './request-handler';
import { RegisteredUser, registerUser } from './auth';

export interface LinkedPair {
  trainer: RegisteredUser;
  client: RegisteredUser;
  requestId: string;
}

/**
 * The one piece of real machinery the API suite needs.
 *
 * A trainer may only create plans for a client linked to them through a
 * PlanRequest (plan-access.ts:82-86), and ONLY an admin can create that link
 * (PATCH /:id/assign is admin-only). So a freshly registered trainer starts with
 * no clients and gets 403 on every create until this runs:
 *
 *   client registers -> client asks for a plan -> admin assigns the trainer
 *
 * Both users are brand new, so anything built on top of them is invisible to the
 * e2e suite and to other API specs.
 */
export async function createLinkedPair(api: RequestHandler, adminToken: string): Promise<LinkedPair> {
  const trainer = await registerUser(api, 'trainer');
  const client = await registerUser(api, 'client');

  const created = await api
    .path('/plan-requests')
    .token(client.token)
    .body({ goal: `Linked pair ${Date.now()}` })
    .postRequest(201);
  const requestId = created.data.request._id;

  // Assigning also moves the request pending -> assigned.
  await api
    .path(`/plan-requests/${requestId}/assign`)
    .token(adminToken)
    .body({ trainerId: trainer.id })
    .patchRequest(200);

  return { trainer, client, requestId };
}
