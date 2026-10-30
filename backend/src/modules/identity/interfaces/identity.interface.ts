export enum UserRole {
  RESIDENT = 'resident',
  RESPONDER = 'responder',
  MODERATOR = 'moderator',
  COMMUNITY_ADMIN = 'community_admin',
  SUPER_ADMIN = 'super_admin',
}

export enum AccountStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
  BANNED = 'banned',
}

export interface UserResponse {
  id: string;
  phone: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  language: string;
  createdAt: Date;
  communityId?: string;
  responderProfileId?: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    displayName: string;
    role: UserRole;
    accountStatus: string;
    communityId?: string;
  };
}

export interface JwtPayload {
  sub: string;
  phone: string;
  role: UserRole;
  communityId?: string;
}