import type { UserRole } from '../enums/user-role.enum';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserResponse {
  message: string;
}

export interface UserDetailsResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole | null;
  organizationId: number | null;
  createdById: number | null;
}
