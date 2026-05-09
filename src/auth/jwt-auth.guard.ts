import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import type { Request } from 'express';
import type { UserRole } from '../enums/user-role.enum';

const JWT_SECRET = process.env.JWT_SECRET || '';
type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    email?: string;
    organizationId?: number | null;
    role?: UserRole | null;
  };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!JWT_SECRET) {
      throw new InternalServerErrorException('JWT secret is not configured.');
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token is required.');
    }

    try {
      const payload = verify(token, JWT_SECRET) as {
        sub?: string;
        email?: string;
        organizationId?: number | null;
        role?: UserRole | null;
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
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  private extractToken(request: Request): string | null {
    const authorizationHeader = request.headers.authorization;

    if (
      typeof authorizationHeader === 'string' &&
      authorizationHeader.startsWith('Bearer ')
    ) {
      return authorizationHeader.slice(7).trim();
    }

    const tokenHeader = request.headers.token;

    if (typeof tokenHeader === 'string' && tokenHeader.trim().length > 0) {
      return tokenHeader.trim();
    }

    return null;
  }
}
