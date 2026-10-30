import { WebPushDevice } from './entities/web-push-device.entity.js';
import { WebPushService } from './web-push.service.js';
import { WebPushController } from './web-push.controller.js';
import { IdentityModule } from '../identity/identity.module.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsRepository } from './repositories/notifications.repository.js';
import { NotificationSubscription } from './entities/notification-subscription.entity.js';
import { NotificationDelivery } from './entities/notification-delivery.entity.js';

@Module({
  imports: [
    IdentityModule,
    TypeOrmModule.forFeature([
      NotificationSubscription,
      NotificationDelivery,
      WebPushDevice,
    ]),
  ],
  controllers: [NotificationsController, WebPushController],
  providers: [NotificationsService, NotificationsRepository, WebPushService],
  exports: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
