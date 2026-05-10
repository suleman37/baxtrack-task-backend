import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRole } from '../enums/user-role.enum';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OrganizationScopeGuard } from './organization-scope.guard';
import type { AuthMeResponse } from './auth.types';

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    email?: string;
    organizationId?: number | null;
    role?: UserRole | null;
  };
  organizationScope?: number;
};

/**
 * Session / scope context. Prefer this over decoding JWT for "which org am I acting in?"
 * — JWT `organizationId` stays whatever is stored on the user row at login (null for super_admin).
 */
@Controller('auth')
@UseGuards(JwtAuthGuard, OrganizationScopeGuard)
export class AuthController {
  @Get('me')
  getMe(@Req() request: AuthenticatedRequest): AuthMeResponse {
    const u = request.user;
    if (!u) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

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
