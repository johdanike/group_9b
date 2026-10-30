import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity.js';
import type { JwtPayload } from '../interfaces/identity.interface.js';

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role as any,
      communityId: user.communityId,
    };

    return this.jwtService.sign(payload, {
      secret:
        this.configService.get('JWT_SECRET') || 'neighbourhood-signal-secret',
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRY') || '15m',
    });
  }

  generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role as any,
      communityId: user.communityId,
    };

    return this.jwtService.sign(payload, {
      secret:
        this.configService.get('JWT_REFRESH_SECRET') ||
        'neighbourhood-signal-refresh-secret',
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY') || '7d',
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret:
        this.configService.get('JWT_SECRET') || 'neighbourhood-signal-secret',
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret:
        this.configService.get('JWT_REFRESH_SECRET') ||
        'neighbourhood-signal-refresh-secret',
    });
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
