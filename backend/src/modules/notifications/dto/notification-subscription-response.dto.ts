import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationSubscription } from '../entities/notification-subscription.entity.js';

export class NotificationSubscriptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  areaOrRadius: number;

  @ApiProperty({ enum: ['low', 'normal', 'high', 'critical'] })
  priorityThreshold: string;

  @ApiPropertyOptional()
  quietHours?: {
    start?: string;
    end?: string;
    days?: string[];
  };

  constructor(subscription: NotificationSubscription) {
    this.userId = subscription.userId;
    this.category = subscription.category;
    this.areaOrRadius = subscription.areaOrRadius;
    this.latitude = subscription.latitude;
    this.longitude = subscription.longitude;
    this.priorityThreshold = subscription.priorityThreshold;
    this.quietHours = subscription.quietHours;
  }
}
