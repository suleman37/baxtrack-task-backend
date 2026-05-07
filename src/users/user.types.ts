import type { UserRole } from '../enums/user-role.enum';

export interface CreateUserPayload {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organizationId: number;
}

export interface UserResponse {
  message: string;
}
