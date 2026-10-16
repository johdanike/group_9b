import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationSubscriptionDto } from './create-notification-subscription.dto.js';

export class UpdateNotificationSubscriptionDto extends PartialType(CreateNotificationSubscriptionDto) {}