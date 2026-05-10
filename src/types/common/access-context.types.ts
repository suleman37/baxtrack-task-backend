import type { UserRole } from '../../common/enums/user-role.enum';

export interface AccessActor {
  id: number;
  organizationId?: number | null;
  role?: UserRole | null;
  organizationScope?: number;
}
