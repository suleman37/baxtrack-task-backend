import { Controller, Get, Req } from '@nestjs/common';
import { getAuthenticatedUserOrThrow } from '../common/auth/access-context.util';
import type { AuthMeResponse } from '../types/auth/auth.types';
import type { AuthenticatedRequest } from '../types/http/authenticated-request.types';

/**
 * Session / scope context. Prefer this over decoding JWT for "which org am I acting in?"
 * — JWT `organizationId` stays whatever is stored on the user row at login (null for super_admin).
 */
@Controller('auth')
export class AuthController {
  @Get('me')
  getMe(@Req() request: AuthenticatedRequest): AuthMeResponse {
    const u = getAuthenticatedUserOrThrow(request);

    return {
      userId: u.id,
      email: u.email,
      role: u.role ?? null,
      organizationId: u.organizationId ?? null,
      actingOrganizationId:
        u.role === 'super_admin' && request.organizationScope != null
          ? request.organizationScope
          : null,
    };
  }
}
