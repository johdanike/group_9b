import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryBuilder } from 'typeorm';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationSubscription } from '../entities/notification-subscription.entity.js';
import { NotificationDelivery } from '../entities/notification-delivery.entity.js';
import {
  DeliveryChannel,
  DeliveryState,
  NotificationDeliveryFilterDto,
} from '../dto/notification-delivery.dto.js';

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository;
  let subscriptionRepo: Partial<Repository<NotificationSubscription>>;
  let deliveryRepo: Partial<Repository<NotificationDelivery>>;
  let mockQueryBuilder: any;

  const mockUserId = 'user-123';
  const mockCategory = 'flooding';
  const mockIncidentId = 'incident-456';

  beforeEach(async () => {
    mockQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getMany: vi.fn(),
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      getRawMany: vi.fn(),
    };

    subscriptionRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    deliveryRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn(),
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsRepository,
        {
          provide: getRepositoryToken(NotificationSubscription),
          useValue: subscriptionRepo,
        },
        {
          provide: getRepositoryToken(NotificationDelivery),
          useValue: deliveryRepo,
        },
      ],
    }).compile();

    repository = module.get<NotificationsRepository>(NotificationsRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findSubscriptionsByUser', () => {
    it('should return all subscriptions for user', async () => {
      const mockSubscriptions = [
        { userId: mockUserId, category: 'flooding' },
        { userId: mockUserId, category: 'traffic' },
      ];
      (subscriptionRepo.find as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSubscriptions as any,
      );

      const result = await repository.findSubscriptionsByUser(mockUserId);

      expect(subscriptionRepo.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findSubscription', () => {
    it('should return subscription when found', async () => {
      const mockSubscription = { userId: mockUserId, category: mockCategory };
      (subscriptionRepo.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSubscription as any,
      );

      const result = await repository.findSubscription(
        mockUserId,
        mockCategory,
      );

      expect(subscriptionRepo.findOne).toHaveBeenCalledWith({
        where: { userId: mockUserId, category: mockCategory },
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should return null when not found', async () => {
      (subscriptionRepo.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      const result = await repository.findSubscription(
        mockUserId,
        'nonexistent',
      );

      expect(result).toBeNull();
    });
  });

  describe('upsertSubscription', () => {
    it('should update existing subscription', async () => {
      const existing = {
        userId: mockUserId,
        category: mockCategory,
        areaOrRadius: 5,
      };
      const updated = { ...existing, areaOrRadius: 10 };
      vi.spyOn(repository, 'findSubscription').mockResolvedValue(
        existing as any,
      );
      (subscriptionRepo.save as ReturnType<typeof vi.fn>).mockResolvedValue(
        updated as any,
      );

      const result = await repository.upsertSubscription({
        userId: mockUserId,
        category: mockCategory,
        areaOrRadius: 10,
      });

      expect(repository.findSubscription).toHaveBeenCalledWith(
        mockUserId,
        mockCategory,
      );
      expect(subscriptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ areaOrRadius: 10 }),
      );
      expect(result.areaOrRadius).toBe(10);
    });

    it('should create new subscription when not exists', async () => {
      vi.spyOn(repository, 'findSubscription').mockResolvedValue(null);
      const newSub = {
        userId: mockUserId,
        category: mockCategory,
        areaOrRadius: 5,
      };
      (subscriptionRepo.create as ReturnType<typeof vi.fn>).mockReturnValue(
        newSub as any,
      );
      (subscriptionRepo.save as ReturnType<typeof vi.fn>).mockResolvedValue(
        newSub as any,
      );

      const result = await repository.upsertSubscription({
        userId: mockUserId,
        category: mockCategory,
        areaOrRadius: 5,
      });

      expect(subscriptionRepo.create).toHaveBeenCalledWith({
        userId: mockUserId,
        category: mockCategory,
        areaOrRadius: 5,
      });
      expect(subscriptionRepo.save).toHaveBeenCalledWith(newSub);
    });
  });

  describe('deleteSubscription', () => {
    it('should delete subscription', async () => {
      (subscriptionRepo.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        affected: 1,
      } as any);

      await repository.deleteSubscription(mockUserId, mockCategory);

      expect(subscriptionRepo.delete).toHaveBeenCalledWith({
        userId: mockUserId,
        category: mockCategory,
      });
    });
  });

  describe('findMatchingSubscriptions', () => {
    it('should query subscriptions matching category, location, and priority', async () => {
      const mockSubscriptions = [
        {
          userId: 'user-1',
          category: 'flooding',
          areaOrRadius: 10,
          priorityThreshold: 'high',
          quietHours: null,
        },
      ];
      (mockQueryBuilder.getMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSubscriptions as any,
      );

      const result = await repository.findMatchingSubscriptions(
        'flooding',
        6.5244,
        3.3792,
        'high',
      );

      expect(subscriptionRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'sub.category = :category',
        { category: 'flooding' },
      );
      expect(result).toHaveLength(1);
    });

    it('should filter out subscriptions in quiet hours', async () => {
      const mockSubscription = {
        userId: 'user-1',
        category: 'flooding',
        areaOrRadius: 10,
        priorityThreshold: 'high',
        quietHours: {
          start: '00:00',
          end: '23:59',
          days: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
        },
      };
      (mockQueryBuilder.getMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        mockSubscription,
      ] as any);

      const result = await repository.findMatchingSubscriptions(
        'flooding',
        6.5244,
        3.3792,
        'high',
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('createDelivery', () => {
    it('should create and save delivery', async () => {
      const deliveryData = {
        incidentIdOrSosId: mockIncidentId,
        recipientId: mockUserId,
        channel: DeliveryChannel.PUSH,
        provider: 'fcm',
      };
      const savedDelivery = { id: 'delivery-1', ...deliveryData };
      (deliveryRepo.create as ReturnType<typeof vi.fn>).mockReturnValue(
        savedDelivery as any,
      );
      (deliveryRepo.save as ReturnType<typeof vi.fn>).mockResolvedValue(
        savedDelivery as any,
      );

      const result = await repository.createDelivery(deliveryData);

      expect(deliveryRepo.create).toHaveBeenCalledWith(deliveryData);
      expect(deliveryRepo.save).toHaveBeenCalledWith(savedDelivery);
      expect(result.id).toBe('delivery-1');
    });
  });

  describe('findDelivery', () => {
    it('should return delivery by ID', async () => {
      const mockDelivery = { id: 'delivery-1', channel: DeliveryChannel.PUSH };
      (deliveryRepo.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDelivery as any,
      );

      const result = await repository.findDelivery('delivery-1');

      expect(deliveryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
      });
      expect(result).toEqual(mockDelivery);
    });
  });

  describe('updateDelivery', () => {
    it('should update and return delivery', async () => {
      const updatedDelivery = {
        id: 'delivery-1',
        deliveryState: DeliveryState.SENT,
      };
      (deliveryRepo.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        affected: 1,
      } as any);
      (deliveryRepo.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        updatedDelivery as any,
      );

      const result = await repository.updateDelivery('delivery-1', {
        deliveryState: DeliveryState.SENT,
      });

      expect(deliveryRepo.update).toHaveBeenCalledWith('delivery-1', {
        deliveryState: DeliveryState.SENT,
      });
      expect(deliveryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
      });
      expect(result).toEqual(updatedDelivery);
    });
  });

  describe('findDeliveriesByIncident', () => {
    it('should return all deliveries for incident', async () => {
      const mockDeliveries = [
        { id: 'd1', incidentIdOrSosId: mockIncidentId },
        { id: 'd2', incidentIdOrSosId: mockIncidentId },
      ];
      (deliveryRepo.find as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDeliveries as any,
      );

      const result = await repository.findDeliveriesByIncident(mockIncidentId);

      expect(deliveryRepo.find).toHaveBeenCalledWith({
        where: { incidentIdOrSosId: mockIncidentId },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findPendingDeliveries', () => {
    it('should return pending deliveries ordered by createdAt', async () => {
      const mockDeliveries = [
        {
          id: 'd1',
          deliveryState: DeliveryState.QUEUED,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'd2',
          deliveryState: DeliveryState.QUEUED,
          createdAt: new Date('2024-01-02'),
        },
      ];
      (deliveryRepo.find as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDeliveries as any,
      );

      const result = await repository.findPendingDeliveries(50);

      expect(deliveryRepo.find).toHaveBeenCalledWith({
        where: { deliveryState: DeliveryState.QUEUED },
        take: 50,
        order: { createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findDeliveriesByRecipient', () => {
    it('should return deliveries for recipient ordered by createdAt desc', async () => {
      const mockDeliveries = [
        {
          id: 'd1',
          recipientId: mockUserId,
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 'd2',
          recipientId: mockUserId,
          createdAt: new Date('2024-01-01'),
        },
      ];
      (deliveryRepo.find as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDeliveries as any,
      );

      const result = await repository.findDeliveriesByRecipient(mockUserId);

      expect(deliveryRepo.find).toHaveBeenCalledWith({
        where: { recipientId: mockUserId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('countRecentDeliveries', () => {
    it('should count deliveries within cooldown period', async () => {
      (deliveryRepo.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      const result = await repository.countRecentDeliveries(
        mockUserId,
        mockIncidentId,
        DeliveryChannel.PUSH,
        30,
      );

      expect(deliveryRepo.count).toHaveBeenCalledWith({
        where: {
          recipientId: mockUserId,
          incidentIdOrSosId: mockIncidentId,
          channel: DeliveryChannel.PUSH,
          createdAt: expect.any(Object),
        },
      });
      expect(result).toBe(2);
    });
  });

  describe('getDeliveryStats', () => {
    it('should return stats grouped by delivery state', async () => {
      const mockRaw = [
        { state: 'queued', count: '10' },
        { state: 'sent', count: '50' },
        { state: 'delivered', count: '45' },
      ];
      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue(mockRaw),
      };
      (
        deliveryRepo.createQueryBuilder as ReturnType<typeof vi.fn>
      ).mockReturnValue(mockQb as any);

      const result = await repository.getDeliveryStats({
        channel: DeliveryChannel.PUSH,
      });

      expect(result).toEqual({ queued: 10, sent: 50, delivered: 45 });
    });

    it('should filter by delivery state', async () => {
      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi
          .fn()
          .mockResolvedValue([{ state: 'failed', count: '5' }]),
      };
      (
        deliveryRepo.createQueryBuilder as ReturnType<typeof vi.fn>
      ).mockReturnValue(mockQb as any);

      const result = await repository.getDeliveryStats({
        deliveryState: DeliveryState.FAILED,
      });

      expect(mockQb.andWhere).toHaveBeenCalledWith('d.deliveryState = :state', {
        state: DeliveryState.FAILED,
      });
      expect(result).toEqual({ failed: 5 });
    });
  });
});
