import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity.js';
import { UserLocationPreference } from './entities/user-location-preference.entity.js';
import { AuthController } from './controllers/auth.controller.js';
import { AuthService } from './services/auth.service.js';
import { OtpService } from './services/otp.service.js';
import { JwtTokenService } from './services/jwt.service.js';
import { UserRepository } from './repositories/user.repository.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { RolesGuard } from './guards/roles.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserLocationPreference]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'neighbourhood-signal-secret',
        signOptions: { expiresIn: configService.get('JWT_ACCESS_EXPIRY') || '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    JwtTokenService,
    UserRepository,
    JwtStrategy,
    RolesGuard,
  ],
  exports: [AuthService, UserRepository, JwtTokenService, OtpService, RolesGuard, JwtStrategy],
})
export class IdentityModule {}