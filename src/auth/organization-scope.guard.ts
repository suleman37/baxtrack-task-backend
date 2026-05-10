import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import type { UserRole } from '../enums/user-role.enum';
import { User } from '../users/user.entity';

const HEADER_NAMES = ['x-organization-id', 'X-Organization-Id'] as const;

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    organizationId?: number | null;
    role?: UserRole | null;
  };
};

@Injectable()
export class OrganizationScopeGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return true;
    }

    const raw = this.extractScopeInput(request);
    if (raw === null || raw === undefined) {
      return true;
    }

    const normalized =
      typeof raw === 'string'
        ? raw.trim()
        : Array.isArray(raw)
          ? String(raw[0]).trim()
          : String(raw).trim();

    if (normalized.length === 0) {
      return true;
    }

    if (user.role !== 'super_admin') {
      throw new BadRequestException(
        'Organization scope may only be set for super administrators.',
      );
    }

    const orgId = Number(normalized);
    if (!Number.isInteger(orgId) || orgId <= 0) {
      throw new BadRequestException('Invalid organization id.');
    }

    await this.assertOrganizationExists(orgId);
    request.organizationScope = orgId;
    return true;
  }

  private extractScopeInput(request: AuthenticatedRequest): unknown {
    for (const name of HEADER_NAMES) {
      const value = request.headers[name];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }

    const q = request.query['organizationId'];
    if (q !== undefined && q !== null && String(q).trim() !== '') {
      return q;
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
