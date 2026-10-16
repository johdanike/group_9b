import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationSubscription } from './entities/notification-subscription.entity.js';
import { NotificationDelivery } from './entities/notification-delivery.entity.js';
import { NotificationsRepository } from './repositories/notifications.repository.js';
import {
  CreateNotificationSubscriptionDto,
  QuietHoursDto,
} from './dto/create-notification-subscription.dto.js';
import { UpdateNotificationSubscriptionDto } from './dto/update-notification-subscription.dto.js';
import {
  CreateNotificationDeliveryDto,
  UpdateNotificationDeliveryDto,
  DeliveryChannel,
  DeliveryState,
  NotificationDeliveryFilterDto,
} from './dto/notification-delivery.dto.js';
import { NotificationSubscriptionResponseDto } from './dto/notification-subscription-response.dto.js';

export interface EnqueueNotificationParams {
  incidentIdOrSosId: string;
  category: string;
  latitude: number;
  longitude: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  title: string;
  body: string;
  data?: Record<string, any>;
  channels?: DeliveryChannel[];
  cooldownMinutes?: number;
}

export interface DeliveryResult {
  deliveryId: string;
  channel: DeliveryChannel;
  recipientId: string;
  status: 'enqueued' | 'skipped_duplicate' | 'skipped_no_subscription';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly DEFAULT_COOLDOWN_MINUTES = 30;
  private readonly DEFAULT_CHANNELS: DeliveryChannel[] = [DeliveryChannel.PUSH];

  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  // Subscription management
  async createSubscription(
    userId: string,
    dto: CreateNotificationSubscriptionDto,
  ): Promise<NotificationSubscriptionResponseDto> {
    const subscription = await this.notificationsRepository.upsertSubscription({
      userId,
      category: dto.category,
      areaOrRadius: dto.areaOrRadius,
      priorityThreshold: dto.priorityThreshold ?? 'normal',
      quietHours: dto.quietHours,
    });
    return new NotificationSubscriptionResponseDto(subscription);
  }

  async getSubscriptions(userId: string): Promise<NotificationSubscriptionResponseDto[]> {
    const subscriptions = await this.notificationsRepository.findSubscriptionsByUser(userId);
    return subscriptions.map((s) => new NotificationSubscriptionResponseDto(s));
  }

  async getSubscription(userId: string, category: string): Promise<NotificationSubscriptionResponseDto | null> {
    const subscription = await this.notificationsRepository.findSubscription(userId, category);
    return subscription ? new NotificationSubscriptionResponseDto(subscription) : null;
  }

  async updateSubscription(
    userId: string,
    category: string,
    dto: UpdateNotificationSubscriptionDto,
  ): Promise<NotificationSubscriptionResponseDto | null> {
    const existing = await this.notificationsRepository.findSubscription(userId, category);
    if (!existing) return null;

    const updated = await this.notificationsRepository.upsertSubscription({
      ...existing,
      ...dto,
      userId,
      category,
    });
    return new NotificationSubscriptionResponseDto(updated);
  }

  async deleteSubscription(userId: string, category: string): Promise<void> {
    await this.notificationsRepository.deleteSubscription(userId, category);
  }

  // Notification enqueueing with deduplication
  async enqueueNotification(params: EnqueueNotificationParams): Promise<DeliveryResult[]> {
    const {
      incidentIdOrSosId,
      category,
      latitude,
      longitude,
      priority,
      title,
      body,
      data,
      channels = this.DEFAULT_CHANNELS,
      cooldownMinutes = this.DEFAULT_COOLDOWN_MINUTES,
    } = params;

    const subscriptions = await this.notificationsRepository.findMatchingSubscriptions(
      category,
      latitude,
      longitude,
      priority,
    );

    if (subscriptions.length === 0) {
      this.logger.debug(`No matching subscriptions for incident ${incidentIdOrSosId} category ${category}`);
      return [];
    }

    const results: DeliveryResult[] = [];

    for (const subscription of subscriptions) {
      for (const channel of channels) {
        // Check deduplication: has this user received a notification for this incident via this channel recently?
        const recentCount = await this.notificationsRepository.countRecentDeliveries(
          subscription.userId,
          incidentIdOrSosId,
          channel,
          cooldownMinutes,
        );

        if (recentCount > 0) {
          this.logger.debug(
            `Skipping duplicate notification for user ${subscription.userId}, incident ${incidentIdOrSosId}, channel ${channel}`,
          );
          results.push({
            deliveryId: '',
            channel,
            recipientId: subscription.userId,
            status: 'skipped_duplicate',
          });
          continue;
        }

        // Create delivery record
        const delivery = await this.notificationsRepository.createDelivery({
          incidentIdOrSosId,
          recipientId: subscription.userId,
          channel,
          provider: this.getProviderForChannel(channel),
          attempt: 1,
          deliveryState: DeliveryState.QUEUED,
          timestamps: { enqueuedAt: new Date() },
          costMetadata: {},
        });

        results.push({
          deliveryId: delivery.id,
          channel,
          recipientId: subscription.userId,
          status: 'enqueued',
        });

        this.logger.debug(`Enqueued notification ${delivery.id} for user ${subscription.userId} via ${channel}`);
      }
    }

    return results;
  }

  // Delivery processing
  async getPendingDeliveries(limit = 100): Promise<NotificationDelivery[]> {
    return this.notificationsRepository.findPendingDeliveries(limit);
  }

  async markDeliverySent(deliveryId: string, providerResponse?: any): Promise<NotificationDelivery | null> {
    const updates: Partial<NotificationDelivery> = {
      deliveryState: DeliveryState.SENT,
      timestamps: { sentAt: new Date(), ...providerResponse },
    };
    if (providerResponse?.cost) {
      updates.costMetadata = { ...updates.costMetadata, ...providerResponse.cost };
    }
    return this.notificationsRepository.updateDelivery(deliveryId, updates);
  }

  async markDeliveryDelivered(deliveryId: string, providerResponse?: any): Promise<NotificationDelivery | null> {
    return this.notificationsRepository.updateDelivery(deliveryId, {
      deliveryState: DeliveryState.DELIVERED,
      timestamps: { deliveredAt: new Date(), ...providerResponse },
    });
  }

  async markDeliveryFailed(deliveryId: string, error: string, willRetry: boolean): Promise<NotificationDelivery | null> {
    const delivery = await this.notificationsRepository.findDelivery(deliveryId);
    if (!delivery) return null;

    const nextAttempt = willRetry ? delivery.attempt + 1 : delivery.attempt;
    const nextState = willRetry ? DeliveryState.QUEUED : DeliveryState.FAILED;

    return this.notificationsRepository.updateDelivery(deliveryId, {
      attempt: nextAttempt,
      deliveryState: nextState,
      timestamps: { failedAt: new Date(), error, ...delivery.timestamps },
    });
  }

  async markDeliveryAcknowledged(deliveryId: string): Promise<NotificationDelivery | null> {
    return this.notificationsRepository.updateDelivery(deliveryId, {
      deliveryState: DeliveryState.ACKNOWLEDGED,
      timestamps: { acknowledgedAt: new Date() },
    });
  }

  async retryFailedDeliveries(maxAttempts = 3): Promise<number> {
    const failedDeliveries = await this.notificationsRepository.findFailedDeliveries();

    let retried = 0;
    for (const delivery of failedDeliveries) {
      if (delivery.attempt < maxAttempts) {
        await this.notificationsRepository.updateDelivery(delivery.id, {
          deliveryState: DeliveryState.QUEUED,
          attempt: delivery.attempt + 1,
        });
        retried++;
      }
    }
    return retried;
  }

  // Query methods
  async getDelivery(deliveryId: string): Promise<NotificationDelivery | null> {
    return this.notificationsRepository.findDelivery(deliveryId);
  }

  async getDeliveriesByIncident(incidentId: string): Promise<NotificationDelivery[]> {
    return this.notificationsRepository.findDeliveriesByIncident(incidentId);
  }

  async getDeliveriesByRecipient(recipientId: string): Promise<NotificationDelivery[]> {
    return this.notificationsRepository.findDeliveriesByRecipient(recipientId);
  }

  async filterDeliveries(filters: NotificationDeliveryFilterDto): Promise<{ data: NotificationDelivery[]; total: number }> {
    // This would be implemented with query builder for pagination
    // For now, use repository method
    const allDeliveries = await this.notificationsRepository.filterDeliveries(filters);
    return { data: allDeliveries, total: allDeliveries.length };
  }

  async getDeliveryStats(since?: Date): Promise<Record<string, number>> {
    return this.notificationsRepository.getDeliveryStats({ since });
  }

  private getProviderForChannel(channel: DeliveryChannel): string {
    const providers: Record<DeliveryChannel, string> = {
      [DeliveryChannel.PUSH]: 'fcm',
      [DeliveryChannel.SMS]: 'twilio',
      [DeliveryChannel.EMAIL]: 'sendgrid',
      [DeliveryChannel.VOICE]: 'twilio',
      [DeliveryChannel.USSD]: 'africas_talking',
    };
    return providers[channel] ?? 'unknown';
  }

  // Helper to validate quiet hours format
  static validateQuietHours(quietHours: QuietHoursDto): boolean {
    if (!quietHours?.start || !quietHours?.end) return true;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(quietHours.start) && timeRegex.test(quietHours.end);
  }
}