import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import type { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || '';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!JWT_SECRET) {
      throw new InternalServerErrorException('JWT secret is not configured.');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token is required.');
    }

    try {
      verify(token, JWT_SECRET);
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
