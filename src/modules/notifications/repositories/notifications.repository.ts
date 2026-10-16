import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, In } from 'typeorm';
import { NotificationSubscription } from '../entities/notification-subscription.entity.js';
import { NotificationDelivery } from '../entities/notification-delivery.entity.js';
import { DeliveryState, DeliveryChannel, NotificationDeliveryFilterDto } from '../dto/notification-delivery.dto.js';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(NotificationSubscription)
    private readonly subscriptionRepo: Repository<NotificationSubscription>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepo: Repository<NotificationDelivery>,
  ) {}

  // Subscription methods
  async findSubscriptionsByUser(userId: string): Promise<NotificationSubscription[]> {
    return this.subscriptionRepo.find({ where: { userId } });
  }

  async findSubscription(userId: string, category: string): Promise<NotificationSubscription | null> {
    return this.subscriptionRepo.findOne({ where: { userId, category } });
  }

  async upsertSubscription(subscription: Partial<NotificationSubscription>): Promise<NotificationSubscription> {
    const existing = await this.findSubscription(subscription.userId!, subscription.category!);
    if (existing) {
      Object.assign(existing, subscription);
      return this.subscriptionRepo.save(existing);
    }
    const newSubscription = this.subscriptionRepo.create(subscription);
    return this.subscriptionRepo.save(newSubscription);
  }

  async deleteSubscription(userId: string, category: string): Promise<void> {
    await this.subscriptionRepo.delete({ userId, category });
  }

  async findMatchingSubscriptions(
    category: string,
    latitude: number,
    longitude: number,
    priority: string,
  ): Promise<NotificationSubscription[]> {
    // Find subscriptions for this category with radius covering the location
    // and priority threshold <= notification priority
    const priorityOrder = { low: 0, normal: 1, high: 2, critical: 3 };
    const notificationPriority = priorityOrder[priority as keyof typeof priorityOrder] ?? 1;

    const subscriptions = await this.subscriptionRepo
      .createQueryBuilder('sub')
      .where('sub.category = :category', { category })
      .andWhere(`ST_DWithin(
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(0, 0), 4326)::geography,
        sub.area_or_radius * 1000
      )`, { latitude, longitude })
      .andWhere(
        `CASE sub.priority_threshold
          WHEN 'low' THEN 0
          WHEN 'normal' THEN 1
          WHEN 'high' THEN 2
          WHEN 'critical' THEN 3
          ELSE 1
        END <= :priority`,
        { priority: notificationPriority },
      )
      .getMany();

    // Filter out quiet hours
    return subscriptions.filter((sub) => !this.isInQuietHours(sub.quietHours));
  }

  private isInQuietHours(quietHours: any): boolean {
    if (!quietHours?.start || !quietHours?.end) return false;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = quietHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Check days if specified
    if (quietHours.days?.length) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = dayNames[now.getDay()];
      if (!quietHours.days.includes(today)) return false;
    }

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 07:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Delivery methods
  async createDelivery(delivery: Partial<NotificationDelivery>): Promise<NotificationDelivery> {
    const newDelivery = this.deliveryRepo.create(delivery);
    return this.deliveryRepo.save(newDelivery);
  }

  async findDelivery(id: string): Promise<NotificationDelivery | null> {
    return this.deliveryRepo.findOne({ where: { id } });
  }

  async updateDelivery(id: string, updates: Partial<NotificationDelivery>): Promise<NotificationDelivery | null> {
    await this.deliveryRepo.update(id, updates);
    return this.findDelivery(id);
  }

  async findDeliveriesByIncident(incidentId: string): Promise<NotificationDelivery[]> {
    return this.deliveryRepo.find({ where: { incidentIdOrSosId: incidentId } });
  }

  async findPendingDeliveries(limit = 100): Promise<NotificationDelivery[]> {
    return this.deliveryRepo.find({
      where: { deliveryState: DeliveryState.QUEUED },
      take: limit,
      order: { createdAt: 'ASC' },
    });
  }

  async findDeliveriesByRecipient(recipientId: string): Promise<NotificationDelivery[]> {
    return this.deliveryRepo.find({ where: { recipientId }, order: { createdAt: 'DESC' } });
  }

  async countRecentDeliveries(
    recipientId: string,
    incidentIdOrSosId: string,
    channel: DeliveryChannel,
    cooldownMinutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    return this.deliveryRepo.count({
      where: {
        recipientId,
        incidentIdOrSosId,
        channel,
        createdAt: MoreThanOrEqual(since),
      },
    });
  }

  async getDeliveryStats(filters: { channel?: DeliveryChannel; deliveryState?: DeliveryState; since?: Date }) {
    const qb = this.deliveryRepo.createQueryBuilder('d').select('d.deliveryState', 'state').addSelect('COUNT(*)', 'count');
    if (filters.channel) qb.andWhere('d.channel = :channel', { channel: filters.channel });
    if (filters.deliveryState) qb.andWhere('d.deliveryState = :state', { state: filters.deliveryState });
    if (filters.since) qb.andWhere('d.createdAt >= :since', { since: filters.since });
    qb.groupBy('d.deliveryState');
    const raw = await qb.getRawMany();
    return raw.reduce((acc, r) => ({ ...acc, [r.state]: Number(r.count) }), {});
  }

  async findFailedDeliveries(): Promise<NotificationDelivery[]> {
    return this.deliveryRepo.find({ where: { deliveryState: DeliveryState.FAILED } });
  }

  async filterDeliveries(filters: NotificationDeliveryFilterDto): Promise<NotificationDelivery[]> {
    return this.deliveryRepo.find({
      where: {
        ...(filters.incidentIdOrSosId && { incidentIdOrSosId: filters.incidentIdOrSosId }),
        ...(filters.recipientId && { recipientId: filters.recipientId }),
        ...(filters.channel && { channel: filters.channel }),
        ...(filters.deliveryState && { deliveryState: filters.deliveryState }),
      },
      order: { createdAt: 'DESC' },
      skip: ((filters.page ?? 1) - 1) * (filters.limit ?? 20),
      take: filters.limit ?? 20,
    });
  }
}