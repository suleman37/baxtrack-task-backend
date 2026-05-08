import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { syncPrimaryKeySequence } from '../database/sync-primary-key-sequence';
import { User } from './user.entity';
import { CreateUserPayload, UserDetailsResponse, UserResponse } from './user.types';

const scrypt = promisify(scryptCallback);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    user: CreateUserPayload,
    createdById?: number,
  ): Promise<UserResponse> {
    this.validateUser(user);
    const email = user.email.trim().toLowerCase();
    const emailExists = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(TRIM(user.email)) = :email', { email })
      .getExists();

    if (emailExists) {
      throw new ConflictException('User already Registered');
    }

    const hashedPassword = await this.hashPassword(user.password);
    await syncPrimaryKeySequence(this.usersRepository);
    await this.usersRepository.save(
      this.usersRepository.create({
        name: user.name.trim(),
        email,
        password: hashedPassword,
        role: user.role,
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

  private validateUser(user: CreateUserPayload): void {
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

    if (user.role !== 'admin' && user.role !== 'user') {
      throw new BadRequestException('Role must be admin or user.');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private toUserResponse(user: User): UserDetailsResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      createdById: user.createdById,
    };
  }
}
