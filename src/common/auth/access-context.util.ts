import { UnauthorizedException } from '@nestjs/common';
import type { AccessActor } from '../../types/common/access-context.types';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../../types/http/authenticated-request.types';

export function getAuthenticatedUserOrThrow(
  request: AuthenticatedRequest,
): AuthenticatedUser {
  const user = request.user;

  if (!user) {
    throw new UnauthorizedException('Invalid or expired token.');
  }

  return user;
}

export function getAccessActorOrThrow(
  request: AuthenticatedRequest,
): AccessActor {
  const user = getAuthenticatedUserOrThrow(request);

  return {
    id: user.id,
    organizationId: user.organizationId,
    role: user.role,
    organizationScope: request.organizationScope,
  };
}

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

export function resolveCustomerOrganizationKey(actor: AccessActor): number | null {
  if (actor.role === 'super_admin' && actor.organizationScope == null) {
    return null;
  }

  if (actor.role === 'super_admin' && actor.organizationScope != null) {
    return actor.organizationScope;
  }

  return actor.organizationId ?? actor.id;
}
