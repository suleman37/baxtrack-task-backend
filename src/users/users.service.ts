import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { syncPrimaryKeySequence } from '../common/utils/sync-primary-key-sequence';
import {
  CREATABLE_USER_ROLES,
  isCreatableUserRole,
  type UserRole,
} from '../common/enums/user-role.enum';
import { LogsService } from '../logs/logs.service';
import type { AccessActor } from '../types/common/access-context.types';
import type { PaginationQuery } from '../types/common/pagination.types';
import {
  CreateUserPayload,
  PaginatedUsersResponse,
  UserDetailsResponse,
  UserResponse,
} from '../types/users/user.types';
import { User } from './user.entity';
import { hashPassword } from '../common/utils/password.util';

interface CreatorContext {
  id: number;
  organizationId?: number | null;
  role?: UserRole | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logsService: LogsService,
  ) {}

  async create(
    user: CreateUserPayload,
    creator?: CreatorContext,
  ): Promise<UserResponse> {
    const createdByRole = creator?.role;
    const requestedRole = user.role ?? 'user';

    this.validateUser(user, createdByRole, requestedRole);
    const email = user.email.trim().toLowerCase();
    const emailExists = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(TRIM(user.email)) = :email', { email })
      .getExists();

    if (emailExists) {
      throw new ConflictException('User already Registered');
    }

    const hashedPassword = await hashPassword(user.password);
    const roleToSave = createdByRole === 'super_admin' ? 'admin' : requestedRole;
    await this.ensureAdminUserLimit(roleToSave, creator);
    const organizationName = user.organizationName?.trim() || null;
    const organizationId = this.resolveOrganizationId(roleToSave, creator);
    await syncPrimaryKeySequence(this.usersRepository);
    const savedUser = await this.usersRepository.save(
      this.usersRepository.create({
        name: user.name.trim(),
        email,
        password: hashedPassword,
        role: roleToSave,
        organizationId,
        organizationName,
        createdById: creator?.id ?? null,
      }),
    );

    if (roleToSave === 'admin' && savedUser.organizationId !== savedUser.id) {
      savedUser.organizationId = savedUser.id;
      await this.usersRepository.save(savedUser);
    }

    if (creator?.id) {
      await this.logsService.recordAction({
        action: 'create_user',
        actorId: creator.id,
        userId: savedUser.id,
        organizationId: savedUser.organizationId ?? savedUser.id,
        details: `Created ${savedUser.role} user ${savedUser.name} (${savedUser.email}).`,
      });
    }

    return {
      message: 'User created successfully',
    };
  }

  async findAll(
    actor: AccessActor,
    pagination: PaginationQuery,
  ): Promise<PaginatedUsersResponse> {
    const viewerId = actor.id;
    if (!Number.isInteger(viewerId) || viewerId <= 0) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    if (actor.role === 'super_admin' && actor.organizationScope == null) {
      const [users, total] = await this.usersRepository.findAndCount({
        order: { id: 'ASC' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      });

      return this.toPaginatedUsersResponse(users, total, pagination);
    }

    const createdByFilter =
      actor.role === 'super_admin' && actor.organizationScope != null
        ? actor.organizationScope
        : viewerId;

    const [users, total] = await this.usersRepository.findAndCount({
      where: { createdById: createdByFilter },
      order: { id: 'ASC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return this.toPaginatedUsersResponse(users, total, pagination);
  }

  private validateUser(
    user: CreateUserPayload,
    createdByRole?: UserRole | null,
    requestedRole?: UserRole,
  ): void {
    if (
      !user ||
      typeof user.name !== 'string' ||
      typeof user.email !== 'string' ||
      typeof user.password !== 'string'
    ) {
      throw new BadRequestException('Invalid user payload.');
    }

    if (user.name.trim().length === 0 || user.email.trim().length === 0) {
      throw new BadRequestException('Name and email are required.');
    }

    if (user.password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long.',
      );
    }

    if (
      user.organizationName != null &&
      typeof user.organizationName !== 'string'
    ) {
      throw new BadRequestException('Organization name must be a string.');
    }

    if (createdByRole === 'super_admin') {
      return;
    }

    if (!isCreatableUserRole(requestedRole)) {
      throw new BadRequestException(
        `Role must be one of: ${CREATABLE_USER_ROLES.join(', ')}.`,
      );
    }
  }

  private resolveOrganizationId(
    roleToSave: UserRole,
    creator?: CreatorContext,
  ): number | null {
    if (roleToSave === 'admin') {
      return null;
    }

    if (!creator?.id) {
      return null;
    }

    return creator.organizationId ?? creator.id;
  }

  private async ensureAdminUserLimit(
    roleToSave: UserRole,
    creator?: CreatorContext,
  ): Promise<void> {
    if (creator?.role !== 'admin' || !creator.id || roleToSave !== 'user') {
      return;
    }

    const createdUsersCount = await this.usersRepository.count({
      where: {
        createdById: creator.id,
        role: 'user',
      },
    });

    if (createdUsersCount >= 5) {
      throw new BadRequestException('An admin can create a maximum of 5 users.');
    }
  }

  private toUserResponse(user: User): UserDetailsResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      createdById: user.createdById,
    };
  }

  private toPaginatedUsersResponse(
    users: User[],
    total: number,
    pagination: PaginationQuery,
  ): PaginatedUsersResponse {
    return {
      data: users.map((user) => this.toUserResponse(user)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
      },
    };
  }
}
