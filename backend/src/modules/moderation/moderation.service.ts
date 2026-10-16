import { UserRole } from '../identity/interfaces/identity.interface.js';
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationAction } from './entities/moderation-action.entity.js';
import { ModerationRepository } from './repositories/moderation.repository.js';
import { Report } from '../reports/entities/report.entity.js';
import { Incident } from '../incidents/entities/incident.entity.js';
import { User } from '../identity/entities/user.entity.js';
import {
  CreateModerationActionDto,
  UpdateModerationActionDto,
  ModerationActionFilterDto,
  CreateAppealDto,
  ReviewAppealDto,
  MergeReportsDto,
  ModerationQueueItemDto,
  ModerationActionType,
  ModerationTargetType,
  AppealStatus,
  ReportState,
} from './dto/moderation.dto.js';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly ALLOWED_STATE_TRANSITIONS: Record<string, string[]> = {
    [ReportState.UNVERIFIED]: [
      ReportState.UNDER_REVIEW,
      ReportState.CORROBORATED,
      ReportState.VERIFIED,
      ReportState.DISPUTED,
      ReportState.REMOVED,
    ],
    [ReportState.UNDER_REVIEW]: [
      ReportState.CORROBORATED,
      ReportState.VERIFIED,
      ReportState.DISPUTED,
      ReportState.UNVERIFIED,
      ReportState.REMOVED,
    ],
    [ReportState.CORROBORATED]: [
      ReportState.VERIFIED,
      ReportState.DISPUTED,
      ReportState.RESOLVED,
      ReportState.REMOVED,
    ],
    [ReportState.VERIFIED]: [
      ReportState.DISPUTED,
      ReportState.RESOLVED,
      ReportState.REMOVED,
    ],
    [ReportState.DISPUTED]: [
      ReportState.CORROBORATED,
      ReportState.VERIFIED,
      ReportState.UNVERIFIED,
      ReportState.REMOVED,
    ],
    [ReportState.STALE]: [ReportState.RESOLVED, ReportState.REMOVED],
    [ReportState.RESOLVED]: [ReportState.REMOVED],
    [ReportState.REMOVED]: [],
  };

  constructor(
    private readonly moderationRepository: ModerationRepository,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createAction(
    actorId: string,
    dto: CreateModerationActionDto,
  ): Promise<{
    action: ModerationAction;
    targetUpdated: boolean;
    message: string;
  }> {
    const actor = await this.userRepo.findOne({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Actor not found');
    if (![UserRole.MODERATOR, UserRole.SUPER_ADMIN].includes(actor.role))
      throw new ForbiddenException('Moderator role required');
    if (dto.targetType !== ModerationTargetType.REPORT)
      throw new NotImplementedException(
        'Only report moderation is available in the demo',
      );
    const newState =
      dto.newState ||
      (dto.action === ModerationActionType.APPROVE
        ? ReportState.VERIFIED
        : dto.action === ModerationActionType.REMOVE
          ? ReportState.REMOVED
          : undefined);
    if (!newState)
      throw new BadRequestException('A new report state is required');
    return this.reportRepo.manager.transaction(async (manager) => {
      const report = await manager.findOne(Report, {
        where: { id: dto.targetId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!report) throw new NotFoundException('Report not found');
      if (report.reporterId === actorId)
        throw new ForbiddenException(
          'Moderators cannot verify their own reports',
        );
      if (
        !(this.ALLOWED_STATE_TRANSITIONS[report.state] || []).includes(newState)
      )
        throw new BadRequestException('Invalid report state transition');
      const previousState = report.state;
      report.state = newState;
      await manager.save(report);
      const action = await manager.save(
        ModerationAction,
        manager.create(ModerationAction, {
          actorId,
          targetId: report.id,
          targetType: 'report',
          action: dto.action,
          reason: dto.reason,
          appealStatus: AppealStatus.NONE,
          metadata: { previousState, newState },
        }),
      );
      return {
        action,
        targetUpdated: true,
        message: 'Report updated and audit record saved',
      };
    });
  }

  async getAction(id: string): Promise<ModerationAction | null> {
    return this.moderationRepository.findById(id);
  }

  async updateAction(
    id: string,
    actorId: string,
    dto: UpdateModerationActionDto,
  ): Promise<ModerationAction | null> {
    const action = await this.moderationRepository.findById(id);
    if (!action) {
      throw new NotFoundException('Moderation action not found');
    }
    if (action.actorId !== actorId) {
      const actor = await this.userRepo.findOne({ where: { id: actorId } });
      if (!(actor as any)?.privacySettings?.isAdmin) {
        throw new ForbiddenException(
          'Only the original moderator can update this action',
        );
      }
    }
    return this.moderationRepository.update(id, {
      reason: dto.reason,
      appealStatus: dto.appealStatus as any,
      metadata: { ...action.metadata, ...dto.metadata },
    });
  }

  async filterActions(
    filters: ModerationActionFilterDto,
  ): Promise<{ data: ModerationAction[]; total: number }> {
    return this.moderationRepository.filterActions(filters);
  }

  async getQueue(
    moderatorId: string,
    targetType?: ModerationTargetType,
  ): Promise<ModerationQueueItemDto[]> {
    const reports = await this.reportRepo.find({
      where: [
        { state: 'unverified' },
        { state: 'disputed' },
        { state: 'corroborated' },
      ],
      order: { submittedAt: 'DESC' },
      take: 100,
    });
    return reports as any;
  }

  async createAppeal(
    userId: string,
    dto: CreateAppealDto,
  ): Promise<ModerationAction> {
    const action = await this.moderationRepository.findById(
      dto.moderationActionId,
    );
    if (!action) {
      throw new NotFoundException('Moderation action not found');
    }
    const updated = await this.moderationRepository.update(
      dto.moderationActionId,
      {
        appealStatus: AppealStatus.PENDING,
        metadata: {
          ...action.metadata,
          appeal: {
            userId,
            reason: dto.reason,
            evidence: dto.evidence,
            submittedAt: new Date(),
          },
        },
      },
    );
    if (!updated)
      throw new NotFoundException('Failed to update moderation action');
    return updated;
  }

  async getPendingAppeals(): Promise<ModerationAction[]> {
    return this.moderationRepository.getAppealActions(AppealStatus.PENDING);
  }

  async reviewAppeal(
    moderatorId: string,
    dto: ReviewAppealDto,
  ): Promise<ModerationAction> {
    throw new NotImplementedException(
      'Appeal review is deferred until after the demo',
    );
  }

  async mergeReports(
    moderatorId: string,
    dto: MergeReportsDto,
  ): Promise<{
    action: ModerationAction;
    targetUpdated: boolean;
    message: string;
  }> {
    throw new NotImplementedException(
      'Duplicate grouping is deferred until after the demo',
    );
  }

  async getAuditTrail(targetId: string): Promise<ModerationAction[]> {
    return this.moderationRepository.getActionHistoryForTarget(targetId);
  }

  async getModeratorStats(
    moderatorId: string,
    since?: Date,
  ): Promise<Record<string, number>> {
    return {};
  }

  private async hideTargetInternal(
    targetId: string,
    targetType: ModerationTargetType,
  ): Promise<boolean> {
    return true;
  }
}
