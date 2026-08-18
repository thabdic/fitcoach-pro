export type UserRole = 'client' | 'trainer' | 'admin';

/** Roles a user may pick during public self-registration (admins are seeded). */
export type RegistrableRole = Extract<UserRole, 'client' | 'trainer'>;

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
