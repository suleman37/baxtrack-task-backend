import type { UserRole } from '../../common/enums/user-role.enum';

export interface AuthMeResponse {
  userId: number;
  email?: string;
  role: UserRole | null;
  organizationId: number | null;
  actingOrganizationId: number | null;
}
