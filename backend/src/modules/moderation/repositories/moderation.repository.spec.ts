import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryBuilder } from 'typeorm';
import { ModerationRepository } from './moderation.repository.js';
import { ModerationAction } from '../entities/moderation-action.entity.js';
import {
  ModerationActionType,
  ModerationTargetType,
  AppealStatus,
  ModerationActionFilterDto,
} from '../dto/moderation.dto.js';

describe('ModerationRepository', () => {
  let repository: ModerationRepository;
  let repo: Partial<Repository<ModerationAction>>;

  beforeEach(async () => {
    repo = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      find: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationRepository,
        { provide: getRepositoryToken(ModerationAction), useValue: repo },
      ],
    }).compile();

    repository = module.get<ModerationRepository>(ModerationRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a moderation action', async () => {
      const actionData = {
        actorId: 'actor-1',
        targetId: 'target-1',
        targetType: ModerationTargetType.REPORT,
        action: ModerationActionType.APPROVE,
        reason: 'Report looks valid',
      };
      const savedAction = { id: 'action-1', ...actionData };
      (repo.create as ReturnType<typeof vi.fn>).mockReturnValue(savedAction);
      (repo.save as ReturnType<typeof vi.fn>).mockResolvedValue(savedAction);

      const result = await repository.create(actionData);

      expect(repo.create).toHaveBeenCalledWith(actionData);
      expect(repo.save).toHaveBeenCalledWith(savedAction);
      expect(result).toEqual(savedAction);
    });
  });

  describe('findById', () => {
    it('should return action by id', async () => {
      const action = { id: 'action-1' };
      (repo.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(action);

      const result = await repository.findById('action-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'action-1' } });
      expect(result).toEqual(action);
    });

    it('should return null if not found', async () => {
      (repo.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return action', async () => {
      const updated = { id: 'action-1', appealStatus: AppealStatus.PENDING };
      (repo.update as ReturnType<typeof vi.fn>).mockResolvedValue({ affected: 1 });
      (repo.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

      const result = await repository.update('action-1', { appealStatus: AppealStatus.PENDING });

      expect(repo.update).toHaveBeenCalledWith('action-1', { appealStatus: AppealStatus.PENDING });
      expect(result).toEqual(updated);
    });
  });

  describe('findByTarget', () => {
    it('should find actions by target', async () => {
      const actions = [{ id: 'a1' }, { id: 'a2' }];
      (repo.find as ReturnType<typeof vi.fn>).mockResolvedValue(actions);

      const result = await repository.findByTarget('target-1', ModerationTargetType.REPORT);

      expect(repo.find).toHaveBeenCalledWith({
        where: { targetId: 'target-1', targetType: ModerationTargetType.REPORT },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(actions);
    });
  });

  describe('getActionsByActor', () => {
    it('should find actions by actor', async () => {
      const actions = [{ id: 'a1' }];
      (repo.find as ReturnType<typeof vi.fn>).mockResolvedValue(actions);

      const result = await repository.getActionsByActor('actor-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { actorId: 'actor-1' },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(actions);
    });
  });

  describe('getRecentActions', () => {
    it('should get recent actions with limit', async () => {
      const actions = [{ id: 'a1' }];
      (repo.find as ReturnType<typeof vi.fn>).mockResolvedValue(actions);

      const result = await repository.getRecentActions(10);

      expect(repo.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 10,
      });
      expect(result).toEqual(actions);
    });
  });

  describe('getAppealActions', () => {
    it('should get appeal actions by status', async () => {
      const actions = [{ id: 'a1', appealStatus: AppealStatus.PENDING }];
      (repo.find as ReturnType<typeof vi.fn>).mockResolvedValue(actions);

      const result = await repository.getAppealActions(AppealStatus.PENDING);

      expect(repo.find).toHaveBeenCalledWith({
        where: { appealStatus: AppealStatus.PENDING },
        order: { timestamp: 'ASC' },
      });
      expect(result).toEqual(actions);
    });
  });

  describe('getActionHistoryForTarget', () => {
    it('should get action history for target', async () => {
      const actions = [{ id: 'a1' }];
      (repo.find as ReturnType<typeof vi.fn>).mockResolvedValue(actions);

      const result = await repository.getActionHistoryForTarget('target-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { targetId: 'target-1' },
        order: { timestamp: 'ASC' },
      });
      expect(result).toEqual(actions);
    });
  });
});