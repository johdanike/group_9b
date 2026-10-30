import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  ArrayMaxSize,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../interfaces/identity.interface.js';

export class SendOtpDto {
  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(6)
  otp: string;
}

export class CompleteProfileDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  displayName: string;

  @ApiProperty({ example: 'en', required: false })
  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsIn(['Yaba', 'Ikeja', 'Surulere', 'Eti-Osa', 'Lagos Island', 'Ikorodu'], {
    each: true,
  })
  lgas?: string[];
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @ApiProperty({ example: 'en', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  privacySettings?: Record<string, any>;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: string;
    phone: string;
    displayName: string;
    role: UserRole;
    accountStatus: string;
    communityId?: string;
  };
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
