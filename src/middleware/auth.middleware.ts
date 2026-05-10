import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NestMiddleware,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { verify } from 'jsonwebtoken';
import type { NextFunction, Response } from 'express';
import { Repository } from 'typeorm';
import {
  AUTHORIZATION_BEARER_PREFIX,
  JWT_SECRET,
  ORGANIZATION_SCOPE_HEADER_NAMES,
  TOKEN_HEADER_NAME,
} from '../common/constants/auth.constants';
import type { AuthenticatedRequest } from '../types/http/authenticated-request.types';
import { User } from '../users/user.entity';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async use(
    request: AuthenticatedRequest,
    _: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!JWT_SECRET) {
        throw new InternalServerErrorException('JWT secret is not configured.');
      }

      const token = this.extractToken(request);

      if (!token) {
        throw new UnauthorizedException('Authorization token is required.');
      }

      const payload = verify(token, JWT_SECRET) as {
        sub?: string;
        email?: string;
        organizationId?: number | null;
        role?: User['role'];
      };
      const userId = Number(payload.sub);

      if (!Number.isInteger(userId) || userId <= 0) {
        throw new UnauthorizedException('Invalid or expired token.');
      }

      request.user = {
        id: userId,
        email: payload.email,
        organizationId: payload.organizationId,
        role: payload.role,
      };

      const organizationScope = this.extractOrganizationScope(request);
      if (organizationScope == null) {
        next();
        return;
      }

      if (request.user.role !== 'super_admin') {
        throw new BadRequestException(
          'Organization scope may only be set for super administrators.',
        );
      }

      await this.assertOrganizationExists(organizationScope);
      request.organizationScope = organizationScope;
      next();
    } catch (error) {
      next(error);
    }
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const authorizationHeader = request.headers.authorization;

    if (
      typeof authorizationHeader === 'string' &&
      authorizationHeader.startsWith(AUTHORIZATION_BEARER_PREFIX)
    ) {
      return authorizationHeader
        .slice(AUTHORIZATION_BEARER_PREFIX.length)
        .trim();
    }

    const tokenHeader = request.headers[TOKEN_HEADER_NAME];

    if (typeof tokenHeader === 'string' && tokenHeader.trim().length > 0) {
      return tokenHeader.trim();
    }

    return null;
  }

  private extractOrganizationScope(
    request: AuthenticatedRequest,
  ): number | undefined {
    const rawScope = this.extractScopeInput(request);

    if (rawScope === undefined || rawScope === null) {
      return undefined;
    }

    const normalizedScope = Array.isArray(rawScope)
      ? String(rawScope[0]).trim()
      : String(rawScope).trim();

    if (normalizedScope.length === 0) {
      return undefined;
    }

    const organizationId = Number(normalizedScope);

    if (!Number.isInteger(organizationId) || organizationId <= 0) {
      throw new BadRequestException('Invalid organization id.');
    }

    return organizationId;
  }

  private extractScopeInput(request: AuthenticatedRequest): unknown {
    for (const headerName of ORGANIZATION_SCOPE_HEADER_NAMES) {
      const headerValue = request.headers[headerName];
      if (
        headerValue !== undefined &&
        headerValue !== null &&
        String(headerValue).trim() !== ''
      ) {
        return headerValue;
      }
    }

    const queryValue = request.query.organizationId;
    if (
      queryValue !== undefined &&
      queryValue !== null &&
      String(queryValue).trim() !== ''
    ) {
      return queryValue;
    }

    return undefined;
  }

  private async assertOrganizationExists(orgId: number): Promise<void> {
    const orgAdmin = await this.usersRepository.findOne({
      where: {
        id: orgId,
        role: 'admin',
      },
    });

    if (orgAdmin) {
      return;
    }

    const member = await this.usersRepository.exist({
      where: {
        organizationId: orgId,
      },
    });

    if (member) {
      return;
    }

    throw new NotFoundException('Organization not found.');
  }
}
