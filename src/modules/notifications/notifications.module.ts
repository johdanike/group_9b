import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSubscription } from './entities/notification-subscription.entity.js';
import { NotificationDelivery } from './entities/notification-delivery.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationSubscription, NotificationDelivery])],
  exports: [TypeOrmModule],
})
export class NotificationsModule {}