import { Test, TestingModule } from '@nestjs/testing';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import {
  ModerationActionType,
  ModerationTargetType,
  AppealStatus,
} from './dto/moderation.dto.js';

describe('ModerationController', () => {
  let controller: ModerationController;
  let service: any;

  beforeEach(async () => {
    service = {
      createAction: vi.fn(),
      getAction: vi.fn(),
      updateAction: vi.fn(),
      filterActions: vi.fn(),
      getQueue: vi.fn(),
      createAppeal: vi.fn(),
      getPendingAppeals: vi.fn(),
      reviewAppeal: vi.fn(),
      mergeReports: vi.fn(),
      getAuditTrail: vi.fn(),
      getModeratorStats: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModerationController],
      providers: [{ provide: ModerationService, useValue: service }],
    }).compile();

    controller = module.get<ModerationController>(ModerationController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAction', () => {
    it('should create a moderation action', async () => {
      const result = {
        action: { id: 'action-1' },
        targetUpdated: true,
        message: 'Action recorded',
      };
      service.createAction.mockResolvedValue(result);

      const response = await controller.createAction(
        {
          targetId: 'report-1',
          targetType: ModerationTargetType.REPORT,
          action: ModerationActionType.APPROVE,
          reason: 'Valid report',
        },
        'actor-1',
      );

      expect(response).toEqual(result);
      expect(service.createAction).toHaveBeenCalledWith(
        'actor-1',
        expect.any(Object),
      );
    });
  });

  describe('getAction', () => {
    it('should get action by id', async () => {
      const action = { id: 'action-1' };
      service.getAction.mockResolvedValue(action);

      const response = await controller.getAction('action-1');

      expect(response).toEqual(action);
      expect(service.getAction).toHaveBeenCalledWith('action-1');
    });
  });

  describe('getQueue', () => {
    it('should get moderation queue', async () => {
      const queue = [{ id: 'item-1' }];
      service.getQueue.mockResolvedValue(queue);

      const response = await controller.getQueue('moderator-1');

      expect(response).toEqual(queue);
      expect(service.getQueue).toHaveBeenCalledWith('moderator-1', undefined);
    });
  });

  describe('createAppeal', () => {
    it('should create appeal', async () => {
      const appeal = { id: 'action-1', appealStatus: AppealStatus.PENDING };
      service.createAppeal.mockResolvedValue(appeal);

      const response = await controller.createAppeal(
        {
          moderationActionId: 'action-1',
          reason: 'This decision was incorrect',
        },
        'user-1',
      );

      expect(response).toEqual(appeal);
      expect(service.createAppeal).toHaveBeenCalledWith(
        'user-1',
        expect.any(Object),
      );
    });
  });

  describe('getPendingAppeals', () => {
    it('should get pending appeals', async () => {
      const appeals = [{ id: 'action-1', appealStatus: AppealStatus.PENDING }];
      service.getPendingAppeals.mockResolvedValue(appeals);

      const response = await controller.getPendingAppeals();

      expect(response).toEqual(appeals);
      expect(service.getPendingAppeals).toHaveBeenCalled();
    });
  });

  describe('reviewAppeal', () => {
    it('should review appeal', async () => {
      const action = { id: 'action-1', appealStatus: AppealStatus.APPROVED };
      service.reviewAppeal.mockResolvedValue(action);

      const response = await controller.reviewAppeal(
        'action-1',
        { decision: AppealStatus.APPROVED, reason: 'Appeal justified' },
        'moderator-1',
      );

      expect(response).toEqual(action);
      expect(service.reviewAppeal).toHaveBeenCalledWith(
        'moderator-1',
        expect.any(Object),
      );
    });
  });

  describe('getAuditTrail', () => {
    it('should get audit trail', async () => {
      const actions = [{ id: 'a1' }];
      service.getAuditTrail.mockResolvedValue(actions);

      const response = await controller.getAuditTrail('target-1');

      expect(response).toEqual(actions);
      expect(service.getAuditTrail).toHaveBeenCalledWith('target-1');
    });
  });

  describe('quickReject', () => {
    it('should quick reject a report', async () => {
      const result = {
        action: { id: 'action-1' },
        targetUpdated: true,
        message: 'Removed',
      };
      service.createAction.mockResolvedValue(result);

      const response = await controller.quickReject('report-1', 'actor-1', {
        reason: 'Policy violation',
      });

      expect(response).toEqual(result);
      expect(service.createAction).toHaveBeenCalledWith(
        'actor-1',
        expect.objectContaining({
          targetId: 'report-1',
          targetType: ModerationTargetType.REPORT,
          action: ModerationActionType.REMOVE,
          newState: 'removed',
        }),
      );
    });
  });
});
