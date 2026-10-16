import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class QuietHoursDto {
  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  start?: string;

  @ApiPropertyOptional({ example: '07:00' })
  @IsOptional()
  @IsString()
  end?: string;

  @ApiPropertyOptional({ example: ['Saturday', 'Sunday'] })
  @IsOptional()
  @IsString({ each: true })
  days?: string[];
}

export class CreateNotificationSubscriptionDto {
  @ApiProperty({ enum: ['traffic', 'flooding', 'fire', 'accident', 'utility_outage', 'security', 'public_event', 'community_disruption', 'medical', 'other'] })
  @IsString()
  category: string;

  @ApiProperty({ example: 3.5, description: 'Radius in kilometers' })
  @IsNumber()
  areaOrRadius: number;

  @ApiPropertyOptional({ enum: NotificationPriority, default: NotificationPriority.NORMAL })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priorityThreshold?: NotificationPriority;

  @ApiPropertyOptional({ type: QuietHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto;
}