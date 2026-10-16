import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationService } from './moderation.service.js';
import { ModerationRepository } from './repositories/moderation.repository.js';
import { Report } from '../reports/entities/report.entity.js';
import { Incident } from '../incidents/entities/incident.entity.js';
import { User } from '../identity/entities/user.entity.js';
import { ModerationActionType, ModerationTargetType, AppealStatus, ReportState } from './dto/moderation.dto.js';

describe('ModerationService', () => {
  let service: ModerationService;
  let moderationRepo: any;
  let reportRepo: Partial<Repository<Report>>;
  let incidentRepo: Partial<Repository<Incident>>;
  let userRepo: Partial<Repository<User>>;

  beforeEach(async () => {
    moderationRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      filterActions: vi.fn(),
      getActionsByActor: vi.fn(),
      getRecentActions: vi.fn(),
      countActionsByType: vi.fn(),
      getAppealActions: vi.fn(),
      getActionHistoryForTarget: vi.fn(),
    };

    reportRepo = {
      findOne: vi.fn(),
      update: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    incidentRepo = {
      findOne: vi.fn(),
      update: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    userRepo = {
      findOne: vi.fn(),
      update: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: ModerationRepository, useValue: moderationRepo },
        { provide: getRepositoryToken(Report), useValue: reportRepo },
        { provide: getRepositoryToken(Incident), useValue: incidentRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAction', () => {
    it('should create a moderation action', async () => {
      const actor = { id: 'actor-1' };
      const action = { id: 'action-1', actorId: 'actor-1', targetId: 'report-1' };
      (userRepo.findOne as any).mockResolvedValue(actor);
      (moderationRepo.create as any).mockResolvedValue(action);

      const result = await service.createAction('actor-1', {
        targetId: 'report-1',
        targetType: ModerationTargetType.REPORT,
        action: ModerationActionType.APPROVE,
        reason: 'This report appears valid',
      });

      expect(result.action).toEqual(action);
      expect(result.targetUpdated).toBe(true);
    });

    it('should throw if actor not found', async () => {
      (userRepo.findOne as any).mockResolvedValue(null);

      await expect(
        service.createAction('actor-1', {
          targetId: 'report-1',
          targetType: ModerationTargetType.REPORT,
          action: ModerationActionType.APPROVE,
          reason: 'This report appears valid',
        }),
      ).rejects.toThrow();
    });
  });

  describe('getAction', () => {
    it('should return action by id', async () => {
      const action = { id: 'action-1' };
      (moderationRepo.findById as any).mockResolvedValue(action);

      const result = await service.getAction('action-1');

      expect(result).toEqual(action);
    });
  });

  describe('updateAction', () => {
    it('should update action if actor is owner', async () => {
      const action = { id: 'action-1', actorId: 'actor-1', metadata: {} };
      (moderationRepo.findById as any).mockResolvedValue(action);
      (moderationRepo.update as any).mockResolvedValue({ ...action, appealStatus: AppealStatus.PENDING });

      const result = await service.updateAction('action-1', 'actor-1', { appealStatus: AppealStatus.PENDING });

      expect(result).toBeDefined();
    });

    it('should throw if action not found', async () => {
      (moderationRepo.findById as any).mockResolvedValue(null);

      await expect(service.updateAction('action-1', 'actor-1', {})).rejects.toThrow();
    });
  });

  describe('filterActions', () => {
    it('should filter actions', async () => {
      const actions = { data: [{ id: 'action-1' }], total: 1 };
      (moderationRepo.filterActions as any).mockResolvedValue(actions);

      const result = await service.filterActions({ page: '1', limit: '10' } as any);

      expect(result).toEqual(actions);
    });
  });

  describe('getQueue', () => {
    it('should return queue items', async () => {
      const result = await service.getQueue('moderator-1');

      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('createAppeal', () => {
    it('should create appeal for moderation action', async () => {
      const action = { id: 'action-1', appealStatus: AppealStatus.NONE, metadata: {} };
      (moderationRepo.findById as any).mockResolvedValue(action);
      (moderationRepo.update as any).mockResolvedValue({ ...action, appealStatus: AppealStatus.PENDING });

      const result = await service.createAppeal('user-1', {
        moderationActionId: 'action-1',
        reason: 'This decision was incorrect based on new evidence',
      });

      expect(result).toBeDefined();
    });
  });

  describe('getPendingAppeals', () => {
    it('should return pending appeals', async () => {
      const appeals = [{ id: 'action-1', appealStatus: AppealStatus.PENDING }];
      (moderationRepo.getAppealActions as any).mockResolvedValue(appeals);

      const result = await service.getPendingAppeals();

      expect(result).toEqual(appeals);
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit trail for target', async () => {
      const actions = [{ id: 'a1' }, { id: 'a2' }];
      (moderationRepo.getActionHistoryForTarget as any).mockResolvedValue(actions);

      const result = await service.getAuditTrail('target-1');

      expect(result).toEqual(actions);
    });
  });
});