import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { scrypt as scryptCallback } from 'node:crypto';
import { sign } from 'jsonwebtoken';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { LogsService } from '../logs/logs.service';
import { User } from '../users/user.entity';
import { LoginPayload, LoginResponse } from './login.types';

const scrypt = promisify(scryptCallback);
const JWT_SECRET = process.env.JWT_SECRET || '';

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logsService: LogsService,
  ) {}

  async login(credentials: LoginPayload): Promise<LoginResponse> {
    if (
      !credentials ||
      typeof credentials.email !== 'string' ||
      typeof credentials.password !== 'string'
    ) {
      throw new BadRequestException('Invalid login payload.');
    }

    const email = credentials.email.trim().toLowerCase();
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(TRIM(user.email)) = :email', { email })
      .getOne();

    if (
      !user ||
      !user.password ||
      !(await this.comparePassword(credentials.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.logsService.recordAction({
      action: 'login',
      actorId: user.id,
      userId: user.id,
      organizationId: user.organizationId ?? user.id,
      details: `User ${user.name} logged in.`,
    });

    return {
      message: 'Login successful',
      Token: sign(
        {
          email: user.email,
          organizationId: user.organizationId,
          role: user.role,
        },
        JWT_SECRET,
        {
          subject: String(user.id),
        },
      ),
      role: user.role,
    };
  }

  private async comparePassword(
    password: string,
    storedPassword: string,
  ): Promise<boolean> {
    if (!storedPassword.includes(':')) {
      return storedPassword === password;
    }

    const [salt, storedHash] = storedPassword.split(':');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return derivedKey.toString('hex') === storedHash;
  }
}
