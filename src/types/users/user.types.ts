import type { UserRole } from '../../common/enums/user-role.enum';
import type { PaginatedResponse } from '../common/pagination.types';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  organizationName?: string | null;
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
  organizationName: string | null;
  createdById: number | null;
}

export type PaginatedUsersResponse = PaginatedResponse<UserDetailsResponse>;
