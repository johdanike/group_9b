import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository.js';
import { OtpService } from './otp.service.js';
import { JwtTokenService } from './jwt.service.js';
import { User } from '../entities/user.entity.js';
import { UserRole, AccountStatus, LoginResponseDto } from '../interfaces/identity.interface.js';
import { SendOtpDto, VerifyOtpDto, CompleteProfileDto, UpdateProfileDto, RefreshTokenDto } from '../dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpService: OtpService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async sendOtp(sendOtpDto: SendOtpDto): Promise<{ success: boolean; message: string }> {
    const existingUser = await this.userRepository.findByPhone(sendOtpDto.phone);
    
    if (existingUser && existingUser.accountStatus === AccountStatus.BANNED) {
      throw new UnauthorizedException('Account is banned');
    }

    return this.otpService.sendOtp(sendOtpDto.phone);
  }

  async verifyOtpAndLogin(verifyOtpDto: VerifyOtpDto): Promise<LoginResponseDto> {
    const verification = await this.otpService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.otp);
    
    if (!verification.success) {
      throw new UnauthorizedException(verification.message);
    }

    let user = await this.userRepository.findByPhone(verifyOtpDto.phone);

    if (!user) {
      user = await this.userRepository.create({
        phone: verifyOtpDto.phone,
        displayName: 'User',
        accountStatus: AccountStatus.ACTIVE,
        role: UserRole.RESIDENT,
      });
    } else if (user.accountStatus === AccountStatus.PENDING_VERIFICATION) {
      user.accountStatus = AccountStatus.ACTIVE;
      await this.userRepository.update(user.id, { accountStatus: AccountStatus.ACTIVE });
    }

    await this.userRepository.updateLastLogin(user.id);

    const accessToken = this.jwtTokenService.generateAccessToken(user);
    const refreshToken = this.jwtTokenService.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        displayName: user.displayName,
        role: user.role,
        accountStatus: user.accountStatus,
        communityId: user.communityId,
      },
    };
  }

  async completeProfile(userId: string, profileDto: CompleteProfileDto): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.displayName = profileDto.displayName;
    if (profileDto.role) user.role = profileDto.role;
    if (profileDto.language) user.language = profileDto.language;

    return this.userRepository.update(user.id, user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProfileDto.displayName) user.displayName = updateProfileDto.displayName;
    if (updateProfileDto.language) user.language = updateProfileDto.language;
    if (updateProfileDto.privacySettings) user.privacySettings = updateProfileDto.privacySettings;

    return this.userRepository.update(user.id, user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtTokenService.verifyRefreshToken(refreshTokenDto.refreshToken);
      const user = await this.userRepository.findById(payload.sub);
      
      if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = this.jwtTokenService.generateAccessToken(user);
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findWithRelations(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async assignResponderRole(userId: string, communityId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.RESPONDER && user.communityId === communityId) {
      throw new ConflictException('User is already a responder for this community');
    }

    user.role = UserRole.RESPONDER;
    user.communityId = communityId;

    return this.userRepository.update(user.id, user);
  }

  async assignModeratorRole(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = UserRole.MODERATOR;
    return this.userRepository.update(user.id, user);
  }

  async assignCommunityAdminRole(userId: string, communityId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = UserRole.COMMUNITY_ADMIN;
    user.communityId = communityId;
    return this.userRepository.update(user.id, user);
  }

  async suspendUser(userId: string, reason?: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.accountStatus = AccountStatus.SUSPENDED;
    user.metadata = { ...user.metadata, suspensionReason: reason, suspendedAt: new Date() };

    return this.userRepository.update(user.id, user);
  }

  async banUser(userId: string, reason?: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.accountStatus = AccountStatus.BANNED;
    user.metadata = { ...user.metadata, banReason: reason, bannedAt: new Date() };

    return this.userRepository.update(user.id, user);
  }

  async reactivateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.accountStatus = AccountStatus.ACTIVE;
    user.metadata = { ...user.metadata, reactivatedAt: new Date() };

    return this.userRepository.update(user.id, user);
  }

  async deactivateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.accountStatus = AccountStatus.DEACTIVATED;
    return this.userRepository.update(user.id, user);
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
      return null;
    }
    return user;
  }
}