import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService, EnqueueNotificationParams } from './notifications.service.js';
import { NotificationsRepository } from './repositories/notifications.repository.js';
import { NotificationSubscription } from './entities/notification-subscription.entity.js';
import { NotificationDelivery } from './entities/notification-delivery.entity.js';
import { CreateNotificationSubscriptionDto, NotificationPriority } from './dto/create-notification-subscription.dto.js';
import {
  DeliveryChannel,
  DeliveryState,
  NotificationDeliveryFilterDto,
} from './dto/notification-delivery.dto.js';
import { NotificationSubscriptionResponseDto } from './dto/notification-subscription-response.dto.js';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: any;

  const mockUserId = 'user-123';
  const mockIncidentId = 'incident-456';
  const mockCategory = 'flooding';

  beforeEach(async () => {
    repository = {
      findSubscriptionsByUser: vi.fn(),
      findSubscription: vi.fn(),
      upsertSubscription: vi.fn(),
      deleteSubscription: vi.fn(),
      findMatchingSubscriptions: vi.fn(),
      createDelivery: vi.fn(),
      findDelivery: vi.fn(),
      updateDelivery: vi.fn(),
      findDeliveriesByIncident: vi.fn(),
      findPendingDeliveries: vi.fn(),
      findDeliveriesByRecipient: vi.fn(),
      countRecentDeliveries: vi.fn(),
      getDeliveryStats: vi.fn(),
      findFailedDeliveries: vi.fn(),
      filterDeliveries: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create a new subscription', async () => {
      const dto: CreateNotificationSubscriptionDto = {
        category: 'flooding',
        areaOrRadius: 5,
        priorityThreshold: NotificationPriority.HIGH,
      };
      const mockSubscription = { userId: mockUserId, ...dto, id: 'sub-1' };
      repository.upsertSubscription.mockResolvedValue(mockSubscription as any);

      const result = await service.createSubscription(mockUserId, dto);

      expect(repository.upsertSubscription).toHaveBeenCalledWith({
        userId: mockUserId,
        category: dto.category,
        areaOrRadius: dto.areaOrRadius,
        priorityThreshold: dto.priorityThreshold,
        quietHours: undefined,
      });
      expect(result).toBeInstanceOf(NotificationSubscriptionResponseDto);
      expect(result.category).toBe(dto.category);
    });

    it('should create subscription with quiet hours', async () => {
      const dto: CreateNotificationSubscriptionDto = {
        category: 'traffic',
        areaOrRadius: 3,
        quietHours: { start: '22:00', end: '07:00', days: ['Saturday', 'Sunday'] },
      };
      const mockSubscription = { userId: mockUserId, ...dto };
      repository.upsertSubscription.mockResolvedValue(mockSubscription as any);

      const result = await service.createSubscription(mockUserId, dto);

      expect(result.quietHours).toEqual(dto.quietHours);
    });
  });

  describe('getSubscriptions', () => {
    it('should return all subscriptions for a user', async () => {
      const mockSubscriptions = [
        { userId: mockUserId, category: 'flooding', areaOrRadius: 5, priorityThreshold: 'high' },
        { userId: mockUserId, category: 'traffic', areaOrRadius: 3, priorityThreshold: 'normal' },
      ];
      repository.findSubscriptionsByUser.mockResolvedValue(mockSubscriptions as any);

      const result = await service.getSubscriptions(mockUserId);

      expect(repository.findSubscriptionsByUser).toHaveBeenCalledWith(mockUserId);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(NotificationSubscriptionResponseDto);
    });
  });

  describe('getSubscription', () => {
    it('should return subscription when found', async () => {
      const mockSubscription = { userId: mockUserId, category: mockCategory, areaOrRadius: 5 };
      repository.findSubscription.mockResolvedValue(mockSubscription as any);

      const result = await service.getSubscription(mockUserId, mockCategory);

      expect(repository.findSubscription).toHaveBeenCalledWith(mockUserId, mockCategory);
      expect(result).toBeInstanceOf(NotificationSubscriptionResponseDto);
    });

    it('should return null when not found', async () => {
      repository.findSubscription.mockResolvedValue(null);

      const result = await service.getSubscription(mockUserId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateSubscription', () => {
    it('should update existing subscription', async () => {
      const existing = { userId: mockUserId, category: mockCategory, areaOrRadius: 5 };
      const dto: Partial<CreateNotificationSubscriptionDto> = { areaOrRadius: 10 };
      const updated = { ...existing, ...dto };
      repository.findSubscription.mockResolvedValue(existing as any);
      repository.upsertSubscription.mockResolvedValue(updated as any);

      const result = await service.updateSubscription(mockUserId, mockCategory, dto);

      expect(repository.upsertSubscription).toHaveBeenCalledWith({ ...existing, ...dto, userId: mockUserId, category: mockCategory });
      expect(result?.areaOrRadius).toBe(10);
    });

    it('should return null when subscription not found', async () => {
      repository.findSubscription.mockResolvedValue(null);

      const result = await service.updateSubscription(mockUserId, 'nonexistent', { areaOrRadius: 10 });

      expect(result).toBeNull();
    });
  });

  describe('deleteSubscription', () => {
    it('should delete subscription', async () => {
      repository.deleteSubscription.mockResolvedValue(undefined);

      await service.deleteSubscription(mockUserId, mockCategory);

      expect(repository.deleteSubscription).toHaveBeenCalledWith(mockUserId, mockCategory);
    });
  });

  describe('enqueueNotification', () => {
    it('should enqueue notifications for matching subscriptions', async () => {
      const params: EnqueueNotificationParams = {
        incidentIdOrSosId: mockIncidentId,
        category: 'flooding',
        latitude: 6.5244,
        longitude: 3.3792,
        priority: 'high',
        title: 'Flood Alert',
        body: 'Heavy flooding reported',
        channels: [DeliveryChannel.PUSH, DeliveryChannel.SMS],
      };

      const mockSubscriptions = [
        { userId: 'user-1', category: 'flooding', areaOrRadius: 10, priorityThreshold: 'high' },
        { userId: 'user-2', category: 'flooding', areaOrRadius: 5, priorityThreshold: 'normal' },
      ];
      repository.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);
      repository.countRecentDeliveries.mockResolvedValue(0);
      repository.createDelivery
        .mockResolvedValueOnce({ id: 'delivery-1', channel: DeliveryChannel.PUSH, recipientId: 'user-1' } as any)
        .mockResolvedValueOnce({ id: 'delivery-2', channel: DeliveryChannel.SMS, recipientId: 'user-1' } as any)
        .mockResolvedValueOnce({ id: 'delivery-3', channel: DeliveryChannel.PUSH, recipientId: 'user-2' } as any)
        .mockResolvedValueOnce({ id: 'delivery-4', channel: DeliveryChannel.SMS, recipientId: 'user-2' } as any);

      const results = await service.enqueueNotification(params);

      expect(repository.findMatchingSubscriptions).toHaveBeenCalledWith(
        params.category,
        params.latitude,
        params.longitude,
        params.priority,
      );
      expect(results).toHaveLength(4);
      expect(results.every((r) => r.status === 'enqueued')).toBe(true);
    });

    it('should skip duplicate notifications within cooldown', async () => {
      const params: EnqueueNotificationParams = {
        incidentIdOrSosId: mockIncidentId,
        category: 'flooding',
        latitude: 6.5244,
        longitude: 3.3792,
        priority: 'high',
        title: 'Flood Alert',
        body: 'Heavy flooding reported',
      };

      const mockSubscriptions = [{ userId: 'user-1', category: 'flooding', areaOrRadius: 10 }];
      repository.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);
      repository.countRecentDeliveries.mockResolvedValue(1);

      const results = await service.enqueueNotification(params);

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('skipped_duplicate');
    });

    it('should return empty array when no matching subscriptions', async () => {
      const params: EnqueueNotificationParams = {
        incidentIdOrSosId: mockIncidentId,
        category: 'flooding',
        latitude: 6.5244,
        longitude: 3.3792,
        priority: 'high',
        title: 'Flood Alert',
        body: 'Heavy flooding reported',
      };

      repository.findMatchingSubscriptions.mockResolvedValue([]);

      const results = await service.enqueueNotification(params);

      expect(results).toHaveLength(0);
    });

    it('should use default channels when not specified', async () => {
      const params: EnqueueNotificationParams = {
        incidentIdOrSosId: mockIncidentId,
        category: 'flooding',
        latitude: 6.5244,
        longitude: 3.3792,
        priority: 'high',
        title: 'Flood Alert',
        body: 'Heavy flooding reported',
      };

      const mockSubscriptions = [{ userId: 'user-1', category: 'flooding', areaOrRadius: 10 }];
      repository.findMatchingSubscriptions.mockResolvedValue(mockSubscriptions as any);
      repository.countRecentDeliveries.mockResolvedValue(0);
      repository.createDelivery.mockResolvedValue({ id: 'delivery-1', channel: DeliveryChannel.PUSH, recipientId: 'user-1' } as any);

      const results = await service.enqueueNotification(params);

      expect(repository.createDelivery).toHaveBeenCalledWith(
        expect.objectContaining({ channel: DeliveryChannel.PUSH }),
      );
    });
  });

  describe('getPendingDeliveries', () => {
    it('should return pending deliveries', async () => {
      const mockDeliveries = [
        { id: 'd1', deliveryState: DeliveryState.QUEUED },
        { id: 'd2', deliveryState: DeliveryState.QUEUED },
      ];
      repository.findPendingDeliveries.mockResolvedValue(mockDeliveries as any);

      const result = await service.getPendingDeliveries(50);

      expect(repository.findPendingDeliveries).toHaveBeenCalledWith(50);
      expect(result).toHaveLength(2);
    });
  });

  describe('markDeliverySent', () => {
    it('should update delivery state to sent', async () => {
      const mockDelivery = { id: 'd1', deliveryState: DeliveryState.SENT };
      repository.updateDelivery.mockResolvedValue(mockDelivery as any);

      const result = await service.markDeliverySent('d1', { messageId: 'msg-123' });

      expect(repository.updateDelivery).toHaveBeenCalledWith('d1', expect.objectContaining({
        deliveryState: DeliveryState.SENT,
      }));
      expect(result?.deliveryState).toBe(DeliveryState.SENT);
    });
  });

  describe('markDeliveryDelivered', () => {
    it('should update delivery state to delivered', async () => {
      const mockDelivery = { id: 'd1', deliveryState: DeliveryState.DELIVERED };
      repository.updateDelivery.mockResolvedValue(mockDelivery as any);

      const result = await service.markDeliveryDelivered('d1', { deliveredAt: new Date() });

      expect(repository.updateDelivery).toHaveBeenCalledWith('d1', expect.objectContaining({
        deliveryState: DeliveryState.DELIVERED,
      }));
      expect(result?.deliveryState).toBe(DeliveryState.DELIVERED);
    });
  });

  describe('markDeliveryFailed', () => {
    it('should increment attempt and queue for retry when willRetry is true', async () => {
      const mockDelivery = { id: 'd1', attempt: 1 };
      repository.findDelivery.mockResolvedValue(mockDelivery as any);
      repository.updateDelivery.mockResolvedValue({ ...mockDelivery, attempt: 2, deliveryState: DeliveryState.QUEUED } as any);

      const result = await service.markDeliveryFailed('d1', 'Provider error', true);

      expect(repository.updateDelivery).toHaveBeenCalledWith('d1', expect.objectContaining({
        attempt: 2,
        deliveryState: DeliveryState.QUEUED,
      }));
    });

    it('should mark as failed when max attempts reached', async () => {
      const mockDelivery = { id: 'd1', attempt: 3 };
      repository.findDelivery.mockResolvedValue(mockDelivery as any);
      repository.updateDelivery.mockResolvedValue({ ...mockDelivery, deliveryState: DeliveryState.FAILED } as any);

      const result = await service.markDeliveryFailed('d1', 'Provider error', false);

      expect(repository.updateDelivery).toHaveBeenCalledWith('d1', expect.objectContaining({
        deliveryState: DeliveryState.FAILED,
      }));
    });
  });

  describe('markDeliveryAcknowledged', () => {
    it('should update delivery state to acknowledged', async () => {
      const mockDelivery = { id: 'd1', deliveryState: DeliveryState.ACKNOWLEDGED };
      repository.updateDelivery.mockResolvedValue(mockDelivery as any);

      const result = await service.markDeliveryAcknowledged('d1');

      expect(repository.updateDelivery).toHaveBeenCalledWith('d1', expect.objectContaining({
        deliveryState: DeliveryState.ACKNOWLEDGED,
      }));
      expect(result?.deliveryState).toBe(DeliveryState.ACKNOWLEDGED);
    });
  });

  describe('retryFailedDeliveries', () => {
    it('should retry failed deliveries under max attempts', async () => {
      const failedDeliveries = [
        { id: 'd1', attempt: 1, deliveryState: DeliveryState.FAILED },
        { id: 'd2', attempt: 2, deliveryState: DeliveryState.FAILED },
        { id: 'd3', attempt: 3, deliveryState: DeliveryState.FAILED },
      ];
      repository.findFailedDeliveries.mockResolvedValue(failedDeliveries as any);
      repository.updateDelivery.mockResolvedValue(undefined);

      const retried = await service.retryFailedDeliveries(3);

      expect(retried).toBe(2);
      expect(repository.updateDelivery).toHaveBeenCalledTimes(2);
    });
  });

  describe('getDeliveryStats', () => {
    it('should return delivery statistics', async () => {
      const mockStats = { queued: 10, sent: 50, delivered: 45, failed: 5 };
      repository.getDeliveryStats.mockResolvedValue(mockStats);

      const result = await service.getDeliveryStats(new Date('2024-01-01'));

      expect(repository.getDeliveryStats).toHaveBeenCalledWith({ since: new Date('2024-01-01') });
      expect(result).toEqual(mockStats);
    });
  });

  describe('validateQuietHours', () => {
    it('should return true for valid quiet hours', () => {
      expect(NotificationsService.validateQuietHours({ start: '22:00', end: '07:00' })).toBe(true);
      expect(NotificationsService.validateQuietHours({ start: '00:00', end: '23:59' })).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(NotificationsService.validateQuietHours({ start: '25:00', end: '07:00' })).toBe(false);
      expect(NotificationsService.validateQuietHours({ start: '22:00', end: '24:00' })).toBe(false);
      expect(NotificationsService.validateQuietHours({ start: '22:60', end: '07:00' })).toBe(false);
    });

    it('should return true when quiet hours not provided', () => {
      expect(NotificationsService.validateQuietHours({})).toBe(true);
      expect(NotificationsService.validateQuietHours({ start: '22:00' })).toBe(true);
    });
  });
});