import type { UserRole } from '../enums/user-role.enum';

/** JWT user + optional super-admin org scope (after guards). */
export interface AccessActor {
  id: number;
  organizationId?: number | null;
  role?: UserRole | null;
  organizationScope?: number;
}

/**
 * When acting as an org, the creator id / org admin id is the scoped organization id.
 */
export function resolveCreatorForWrite(actor: AccessActor): AccessActor {
  if (actor.role === 'super_admin' && actor.organizationScope != null) {
    const orgId = actor.organizationScope;
    return {
      id: orgId,
      organizationId: orgId,
      role: 'admin',
    };
  }

  return actor;
}

/**
 * Org key for customer row filtering and membership checks (non-platform admins and users).
 */
export function resolveCustomerOrganizationKey(actor: AccessActor): number | null {
  if (actor.role === 'super_admin' && actor.organizationScope == null) {
    return null;
  }

  if (actor.role === 'super_admin' && actor.organizationScope != null) {
    return actor.organizationScope;
  }

  return actor.organizationId ?? actor.id;
}
