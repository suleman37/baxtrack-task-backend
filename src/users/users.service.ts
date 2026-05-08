import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserPayload, UserDetailsResponse, UserResponse } from './user.types';

const scrypt = promisify(scryptCallback);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(user: CreateUserPayload): Promise<UserResponse> {
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
    await this.usersRepository.save(
      this.usersRepository.create({
        id: user.id,
        name: user.name.trim(),
        email,
        password: hashedPassword,
        role: user.role,
        organizationId: user.organizationId,
      }),
    );

    return {
      message: 'User created successfully',
    };
  }

  async findAll(): Promise<UserDetailsResponse[]> {
    const users = await this.usersRepository.find({
      order: {
        id: 'ASC',
      },
    });

    return users.map((user) => this.toUserResponse(user));
  }

  async findOne(id: number): Promise<UserDetailsResponse> {
    const user = await this.usersRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.toUserResponse(user);
  }

  private validateUser(user: CreateUserPayload): void {
    if (
      !user ||
      typeof user.id !== 'number' ||
      typeof user.name !== 'string' ||
      typeof user.email !== 'string' ||
      typeof user.password !== 'string' ||
      typeof user.organizationId !== 'number'
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

    if (user.role !== 'admin' && user.role !== 'member') {
      throw new BadRequestException('Role must be admin or member.');
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
    };
  }
}
