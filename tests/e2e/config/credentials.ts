

// Exported because the API suite registers throwaway users with the same password.
export const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'Password123!';

export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000/api';
export const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:4200';

export type TestRole = 'admin' | 'trainer' | 'client';
export type AccountKey = 'admin' | 'trainer' | 'client' | 'client2';

export interface TestAccount {
  role: TestRole;
  email: string;
  password: string;
}

export const ACCOUNTS: Record<AccountKey, TestAccount> = {
  admin: {
    role: 'admin',
    email: process.env.ADMIN_EMAIL ?? 'admin@fitcoach.test',
    password: TEST_PASSWORD,
  },
  trainer: {
    role: 'trainer',
    email: process.env.TRAINER_EMAIL ?? 'trainer@fitcoach.test',
    password: TEST_PASSWORD,
  },
  client: {
    role: 'client',
    email: process.env.CLIENT_EMAIL ?? 'client@fitcoach.test',
    password: TEST_PASSWORD,
  },
  client2: {
    role: 'client',
    email: process.env.CLIENT2_EMAIL ?? 'client2@fitcoach.test',
    password: TEST_PASSWORD,
  },
};
