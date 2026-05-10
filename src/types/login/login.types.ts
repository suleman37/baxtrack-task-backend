import type { UserRole } from '../../common/enums/user-role.enum';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  Token: string;
  role: UserRole | null;
  message: string;
}
