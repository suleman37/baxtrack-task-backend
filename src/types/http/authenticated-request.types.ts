import type { Request } from 'express';
import type { UserRole } from '../../common/enums/user-role.enum';

export interface AuthenticatedUser {
  id: number;
  email?: string;
  organizationId?: number | null;
  role?: UserRole | null;
}

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
  organizationScope?: number;
};
