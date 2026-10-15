import { Controller, Post, Get, Put, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service.js';
import { JwtStrategy } from '../strategies/jwt.strategy.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { SendOtpDto, VerifyOtpDto, CompleteProfileDto, UpdateProfileDto, RefreshTokenDto, LoginResponseDto } from '../dto/auth.dto.js';
import { UserRole } from '../interfaces/identity.interface.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and login/register' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtpAndLogin(verifyOtpDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('profile')
  @UseGuards(JwtStrategy)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(JwtStrategy)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Put('complete-profile')
  @UseGuards(JwtStrategy)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete profile after first login' })
  @ApiResponse({ status: 200, description: 'Profile completed' })
  async completeProfile(@Request() req: any, @Body() completeProfileDto: CompleteProfileDto) {
    return this.authService.completeProfile(req.user.id, completeProfileDto);
  }

  @Post('assign-responder')
  @UseGuards(JwtStrategy, RolesGuard)
  @Roles(UserRole.COMMUNITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign responder role to user (admin only)' })
  @ApiResponse({ status: 200, description: 'Role assigned' })
  async assignResponder(@Request() req: any, @Body() body: { userId: string; communityId: string }) {
    return this.authService.assignResponderRole(body.userId, body.communityId);
  }

  @Post('assign-moderator')
  @UseGuards(JwtStrategy, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign moderator role (super admin only)' })
  @ApiResponse({ status: 200, description: 'Role assigned' })
  async assignModerator(@Request() req: any, @Body() body: { userId: string }) {
    return this.authService.assignModeratorRole(body.userId);
  }

  @Post('assign-community-admin')
  @UseGuards(JwtStrategy, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign community admin role (super admin only)' })
  @ApiResponse({ status: 200, description: 'Role assigned' })
  async assignCommunityAdmin(@Request() req: any, @Body() body: { userId: string; communityId: string }) {
    return this.authService.assignCommunityAdminRole(body.userId, body.communityId);
  }

  @Post('suspend')
  @UseGuards(JwtStrategy, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.COMMUNITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend user (moderator+)' })
  @ApiResponse({ status: 200, description: 'User suspended' })
  async suspendUser(@Request() req: any, @Body() body: { userId: string; reason?: string }) {
    return this.authService.suspendUser(body.userId, body.reason);
  }

  @Post('ban')
  @UseGuards(JwtStrategy, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ban user (moderator+)' })
  @ApiResponse({ status: 200, description: 'User banned' })
  async banUser(@Request() req: any, @Body() body: { userId: string; reason?: string }) {
    return this.authService.banUser(body.userId, body.reason);
  }

  @Post('reactivate')
  @UseGuards(JwtStrategy, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate suspended/banned user (moderator+)' })
  @ApiResponse({ status: 200, description: 'User reactivated' })
  async reactivateUser(@Request() req: any, @Body() body: { userId: string }) {
    return this.authService.reactivateUser(body.userId);
  }

  @Post('deactivate')
  @UseGuards(JwtStrategy)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate own account' })
  @ApiResponse({ status: 200, description: 'Account deactivated' })
  async deactivateSelf(@Request() req: any) {
    return this.authService.deactivateUser(req.user.id);
  }
}