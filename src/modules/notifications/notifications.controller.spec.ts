import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationDelivery } from './entities/notification-delivery.entity.js';
import { DeliveryChannel, DeliveryState } from './dto/notification-delivery.dto.js';
import { NotificationSubscriptionResponseDto } from './dto/notification-subscription-response.dto.js';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: Partial<NotificationsService>;

  const mockUserId = 'user-123';
  const mockCategory = 'flooding';
  const mockIncidentId = 'incident-456';

  beforeEach(async () => {
    service = {
      createSubscription: vi.fn(),
      getSubscriptions: vi.fn(),
      getSubscription: vi.fn(),
      updateSubscription: vi.fn(),
      deleteSubscription: vi.fn(),
      enqueueNotification: vi.fn(),
      getPendingDeliveries: vi.fn(),
      getDelivery: vi.fn(),
      filterDeliveries: vi.fn(),
      getDeliveriesByIncident: vi.fn(),
      getDeliveriesByRecipient: vi.fn(),
      markDeliverySent: vi.fn(),
      markDeliveryDelivered: vi.fn(),
      markDeliveryFailed: vi.fn(),
      markDeliveryAcknowledged: vi.fn(),
      retryFailedDeliveries: vi.fn(),
      getDeliveryStats: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create subscription and return response DTO', async () => {
      const dto = { category: mockCategory, areaOrRadius: 5 };
      const mockResponse = new NotificationSubscriptionResponseDto({
        userId: mockUserId,
        category: mockCategory,
        areaOrRadius: 5,
        priorityThreshold: 'normal',
      } as any);
      (service.createSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await controller.createSubscription(dto, mockUserId);

      expect(service.createSubscription).toHaveBeenCalledWith(mockUserId, dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSubscriptions', () => {
    it('should return all subscriptions for user', async () => {
      const mockResponse = [
        new NotificationSubscriptionResponseDto({
          userId: mockUserId,
          category: 'flooding',
          areaOrRadius: 5,
          priorityThreshold: 'normal',
        } as any),
        new NotificationSubscriptionResponseDto({
          userId: mockUserId,
          category: 'traffic',
          areaOrRadius: 3,
          priorityThreshold: 'high',
        } as any),
      ];
      (service.getSubscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await controller.getSubscriptions(mockUserId);

      expect(service.getSubscriptions).toHaveBeenCalledWith(mockUserId);
      expect(result).toHaveLength(2);
    });
  });

  describe('getSubscription', () => {
    it('should return subscription when found', async () => {
      const mockResponse = new NotificationSubscriptionResponseDto({
        userId: mockUserId,
        category: mockCategory,
        areaOrRadius: 5,
        priorityThreshold: 'normal',
      } as any);
      (service.getSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await controller.getSubscription(mockUserId, mockCategory);

      expect(service.getSubscription).toHaveBeenCalledWith(mockUserId, mockCategory);
      expect(result).toEqual(mockResponse);
    });

    it('should return null when not found', async () => {
      (service.getSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await controller.getSubscription(mockUserId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription', async () => {
      const dto = { areaOrRadius: 10 };
      const mockResponse = new NotificationSubscriptionResponseDto({
        userId: mockUserId,
        category: mockCategory,
        areaOrRadius: 10,
        priorityThreshold: 'normal',
      } as any);
      (service.updateSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await controller.updateSubscription(mockUserId, mockCategory, dto);

      expect(service.updateSubscription).toHaveBeenCalledWith(mockUserId, mockCategory, dto);
      expect(result?.areaOrRadius).toBe(10);
    });

    it('should return null when subscription not found', async () => {
      (service.updateSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await controller.updateSubscription(mockUserId, 'nonexistent', { areaOrRadius: 10 });

      expect(result).toBeNull();
    });
  });

  describe('deleteSubscription', () => {
    it('should delete subscription', async () => {
      (service.deleteSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await controller.deleteSubscription(mockUserId, mockCategory);

      expect(service.deleteSubscription).toHaveBeenCalledWith(mockUserId, mockCategory);
    });
  });

  describe('enqueueNotification', () => {
    it('should enqueue notifications', async () => {
      const params = {
        incidentIdOrSosId: mockIncidentId,
        category: 'flooding',
        latitude: 6.5244,
        longitude: 3.3792,
        priority: 'high' as const,
        title: 'Flood Alert',
        body: 'Heavy flooding',
        channels: [DeliveryChannel.PUSH],
      };
      const mockResults = [
        { deliveryId: 'd1', channel: DeliveryChannel.PUSH, recipientId: 'user-1', status: 'enqueued' as const },
      ];
      (service.enqueueNotification as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults);

      const result = await controller.enqueueNotification(params);

      expect(service.enqueueNotification).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockResults);
    });
  });

  describe('getPendingDeliveries', () => {
    it('should return pending deliveries', async () => {
      const mockDeliveries = [
        { id: 'd1', deliveryState: DeliveryState.QUEUED },
        { id: 'd2', deliveryState: DeliveryState.QUEUED },
      ] as NotificationDelivery[];
      (service.getPendingDeliveries as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeliveries);

      const result = await controller.getPendingDeliveries(50);

      expect(service.getPendingDeliveries).toHaveBeenCalledWith(50);
      expect(result).toHaveLength(2);
    });

    it('should use default limit when not provided', async () => {
      (service.getPendingDeliveries as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await controller.getPendingDeliveries();

      expect(service.getPendingDeliveries).toHaveBeenCalledWith(100);
    });
  });

  describe('getDelivery', () => {
    it('should return delivery by ID', async () => {
      const mockDelivery = { id: 'd1', deliveryState: DeliveryState.SENT } as NotificationDelivery;
      (service.getDelivery as ReturnType<typeof vi.fn>).mockResolvedValue(mockDelivery);

      const result = await controller.getDelivery('d1');

      expect(service.getDelivery).toHaveBeenCalledWith('d1');
      expect(result).toEqual(mockDelivery);
    });
  });

  describe('filterDeliveries', () => {
    it('should filter deliveries with pagination', async () => {
      const filters = { page: 1, limit: 10, channel: DeliveryChannel.PUSH };
      const mockResult = { data: [{ id: 'd1' }] as NotificationDelivery[], total: 1 };
      (service.filterDeliveries as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await controller.filterDeliveries(filters);

      expect(service.filterDeliveries).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getDeliveriesByIncident', () => {
    it('should return deliveries for incident', async () => {
      const mockDeliveries = [{ id: 'd1' }, { id: 'd2' }] as NotificationDelivery[];
      (service.getDeliveriesByIncident as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeliveries);

      const result = await controller.getDeliveriesByIncident(mockIncidentId);

      expect(service.getDeliveriesByIncident).toHaveBeenCalledWith(mockIncidentId);
      expect(result).toHaveLength(2);
    });
  });

  describe('getDeliveriesByRecipient', () => {
    it('should return deliveries for user', async () => {
      const mockDeliveries = [{ id: 'd1' }] as NotificationDelivery[];
      (service.getDeliveriesByRecipient as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeliveries);

      const result = await controller.getDeliveriesByRecipient(mockUserId);

      expect(service.getDeliveriesByRecipient).toHaveBeenCalledWith(mockUserId);
      expect(result).toHaveLength(1);
    });
  });

  describe('markSent', () => {
    it('should mark delivery as sent', async () => {
      const mockDelivery = { id: 'd1', deliveryState: DeliveryState.SENT } as NotificationDelivery;
      (service.markDeliverySent as ReturnType<typeof vi.fn>).mockResolvedValue(mockDelivery);

      const result = await controller.markSent('d1', { providerResponse: { messageId: 'msg-1' } });

      expect(service.markDeliverySent).toHaveBeenCalledWith('d1', { messageId: 'msg-1' });
      expect(result).toEqual(mockDelivery);
    });
  });

  describe('markDelivered', () => {
    it('should mark delivery as delivered', async () => {
      const mockDelivery = { id: 'd1', deliveryState: DeliveryState.DELIVERED } as NotificationDelivery;
      (service.markDeliveryDelivered as ReturnType<typeof vi.fn>).mockResolvedValue(mockDelivery);

      const result = await controller.markDelivered('d1', { providerResponse: { deliveredAt: new Date() } });

      expect(service.markDeliveryDelivered).toHaveBeenCalledWith('d1', { deliveredAt: expect.any(Date) });
      expect(result).toEqual(mockDelivery);
    });
  });

  describe('markFailed', () => {
    it('should mark delivery as failed with retry info', async () => {
      const mockDelivery = { id: 'd1', deliveryState: DeliveryState.QUEUED } as NotificationDelivery;
      (service.markDeliveryFailed as ReturnType<typeof vi.fn>).mockResolvedValue(mockDelivery);

      const result = await controller.markFailed('d1', { error: 'Timeout', willRetry: true });

      expect(service.markDeliveryFailed).toHaveBeenCalledWith('d1', 'Timeout', true);
      expect(result).toEqual(mockDelivery);
    });
  });

  describe('markAcknowledged', () => {
    it('should mark delivery as acknowledged', async () => {
      const mockDelivery = { id: 'd1', deliveryState: DeliveryState.ACKNOWLEDGED } as NotificationDelivery;
      (service.markDeliveryAcknowledged as ReturnType<typeof vi.fn>).mockResolvedValue(mockDelivery);

      const result = await controller.markAcknowledged('d1');

      expect(service.markDeliveryAcknowledged).toHaveBeenCalledWith('d1');
      expect(result).toEqual(mockDelivery);
    });
  });

  describe('retryFailedDeliveries', () => {
    it('should retry failed deliveries', async () => {
      (service.retryFailedDeliveries as ReturnType<typeof vi.fn>).mockResolvedValue(3);

      const result = await controller.retryFailedDeliveries(3);

      expect(service.retryFailedDeliveries).toHaveBeenCalledWith(3);
      expect(result).toEqual({ retried: 3 });
    });

    it('should use default maxAttempts', async () => {
      (service.retryFailedDeliveries as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const result = await controller.retryFailedDeliveries();

      expect(service.retryFailedDeliveries).toHaveBeenCalledWith(3);
      expect(result).toEqual({ retried: 1 });
    });
  });

  describe('getDeliveryStats', () => {
    it('should return delivery stats', async () => {
      const mockStats = { queued: 10, sent: 50, delivered: 45, failed: 5 };
      (service.getDeliveryStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockStats);

      const result = await controller.getDeliveryStats('2024-01-01T00:00:00.000Z');

      expect(service.getDeliveryStats).toHaveBeenCalledWith(new Date('2024-01-01T00:00:00.000Z'));
      expect(result).toEqual(mockStats);
    });

    it('should work without since parameter', async () => {
      (service.getDeliveryStats as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await controller.getDeliveryStats();

      expect(service.getDeliveryStats).toHaveBeenCalledWith(undefined);
    });
  });
});