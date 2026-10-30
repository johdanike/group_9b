import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  Max,
  IsIn,
} from 'class-validator';
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
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
  @ApiProperty({
    enum: [
      'traffic',
      'flooding',
      'fire',
      'accident',
      'utility_outage',
      'security',
      'public_event',
      'community_disruption',
      'medical',
      'other',
    ],
  })
  @IsIn([
    'traffic',
    'weather',
    'fire',
    'security',
    'medical',
    'utilities',
    'community',
    'event',
    'other',
  ])
  category: string;

  @ApiProperty({ example: 3.5, description: 'Radius in kilometers' })
  @IsNumber()
  @Min(0.1)
  @Max(100)
  areaOrRadius: number;

  @ApiPropertyOptional({
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priorityThreshold?: NotificationPriority;

  @ApiPropertyOptional({ type: QuietHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto;
}
