import { RegistrableRole, User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: RegistrableRole;
}

/** Shape of `data` returned by /auth/login and /auth/register. */
export interface AuthResponse {
  token: string;
  user: User;
}
