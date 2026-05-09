import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { syncPrimaryKeySequence } from '../database/sync-primary-key-sequence';
import {
  CREATABLE_USER_ROLES,
  isCreatableUserRole,
  type UserRole,
} from '../enums/user-role.enum';
import { User } from './user.entity';
import { hashPassword } from './password.util';
import { CreateUserPayload, UserDetailsResponse, UserResponse } from './user.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    user: CreateUserPayload,
    createdById?: number,
    createdByRole?: UserRole | null,
  ): Promise<UserResponse> {
    this.validateUser(user, createdByRole);
    const email = user.email.trim().toLowerCase();
    const emailExists = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(TRIM(user.email)) = :email', { email })
      .getExists();

    if (emailExists) {
      throw new ConflictException('User already Registered');
    }

    const hashedPassword = await hashPassword(user.password);
    const roleToSave = createdByRole === 'super_admin' ? 'admin' : user.role!;
    const organizationName = user.organizationName?.trim() || null;
    await syncPrimaryKeySequence(this.usersRepository);
    await this.usersRepository.save(
      this.usersRepository.create({
        name: user.name.trim(),
        email,
        password: hashedPassword,
        role: roleToSave,
        organizationName,
        createdById: createdById ?? null,
      }),
    );

    return {
      message: 'User created successfully',
    };
  }

  async findAll(createdById?: number): Promise<UserDetailsResponse[]> {
    if (!Number.isInteger(createdById) || createdById! <= 0) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const users = await this.usersRepository.find({
      where: {
        createdById,
      },
      order: {
        id: 'ASC',
      },
    });

    return users.map((user) => this.toUserResponse(user));
  }

  private validateUser(
    user: CreateUserPayload,
    createdByRole?: UserRole | null,
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

    if (!isCreatableUserRole(user.role)) {
      throw new BadRequestException(
        `Role must be one of: ${CREATABLE_USER_ROLES.join(', ')}.`,
      );
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
}
