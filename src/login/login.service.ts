import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { sign } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { JWT_SECRET } from '../common/constants/auth.constants';
import { comparePassword } from '../common/utils/password.util';
import { LogsService } from '../logs/logs.service';
import type { LoginPayload, LoginResponse } from '../types/login/login.types';
import { User } from '../users/user.entity';

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
      !(await comparePassword(credentials.password, user.password))
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
}
