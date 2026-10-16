import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    [ReportState.UNVERIFIED]: [ReportState.UNDER_REVIEW, ReportState.CORROBORATED, ReportState.VERIFIED, ReportState.DISPUTED, ReportState.REMOVED],
    [ReportState.UNDER_REVIEW]: [ReportState.CORROBORATED, ReportState.VERIFIED, ReportState.DISPUTED, ReportState.UNVERIFIED, ReportState.REMOVED],
    [ReportState.CORROBORATED]: [ReportState.VERIFIED, ReportState.DISPUTED, ReportState.RESOLVED, ReportState.REMOVED],
    [ReportState.VERIFIED]: [ReportState.DISPUTED, ReportState.RESOLVED, ReportState.REMOVED],
    [ReportState.DISPUTED]: [ReportState.CORROBORATED, ReportState.VERIFIED, ReportState.UNVERIFIED, ReportState.REMOVED],
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

  async createAction(actorId: string, dto: CreateModerationActionDto): Promise<{ action: ModerationAction; targetUpdated: boolean; message: string }> {
    const actor = await this.userRepo.findOne({ where: { id: actorId } });
    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    const action = await this.moderationRepository.create({
      actorId,
      targetId: dto.targetId,
      targetType: dto.targetType as any,
      action: dto.action as any,
      reason: dto.reason,
      appealStatus: AppealStatus.NONE,
      metadata: {
        ...dto.metadata,
        newState: dto.newState,
        relatedId: dto.relatedId,
      },
    });

    return { action, targetUpdated: true, message: `Moderation action ${action.id} recorded` };
  }

  async getAction(id: string): Promise<ModerationAction | null> {
    return this.moderationRepository.findById(id);
  }

  async updateAction(id: string, actorId: string, dto: UpdateModerationActionDto): Promise<ModerationAction | null> {
    const action = await this.moderationRepository.findById(id);
    if (!action) {
      throw new NotFoundException('Moderation action not found');
    }
    if (action.actorId !== actorId) {
      const actor = await this.userRepo.findOne({ where: { id: actorId } });
      if (!(actor as any)?.privacySettings?.isAdmin) {
        throw new ForbiddenException('Only the original moderator can update this action');
      }
    }
    return this.moderationRepository.update(id, {
      reason: dto.reason,
      appealStatus: dto.appealStatus as any,
      metadata: { ...action.metadata, ...dto.metadata },
    });
  }

  async filterActions(filters: ModerationActionFilterDto): Promise<{ data: ModerationAction[]; total: number }> {
    return this.moderationRepository.filterActions(filters);
  }

  async getQueue(moderatorId: string, targetType?: ModerationTargetType): Promise<ModerationQueueItemDto[]> {
    return [];
  }

  async createAppeal(userId: string, dto: CreateAppealDto): Promise<ModerationAction> {
    const action = await this.moderationRepository.findById(dto.moderationActionId);
    if (!action) {
      throw new NotFoundException('Moderation action not found');
    }
    const updated = await this.moderationRepository.update(dto.moderationActionId, {
      appealStatus: AppealStatus.PENDING,
      metadata: { ...action.metadata, appeal: { userId, reason: dto.reason, evidence: dto.evidence, submittedAt: new Date() } },
    });
    if (!updated) throw new NotFoundException('Failed to update moderation action');
    return updated;
  }

  async getPendingAppeals(): Promise<ModerationAction[]> {
    return this.moderationRepository.getAppealActions(AppealStatus.PENDING);
  }

  async reviewAppeal(moderatorId: string, dto: ReviewAppealDto): Promise<ModerationAction> {
    const actions = await this.moderationRepository.getAppealActions(AppealStatus.PENDING);
    const action = actions[0];
    if (!action) throw new NotFoundException('No pending appeal found');
    const updated = await this.moderationRepository.update(action.id, { appealStatus: dto.decision as any });
    if (!updated) throw new NotFoundException('Failed to update moderation action');
    return updated;
  }

  async mergeReports(moderatorId: string, dto: MergeReportsDto): Promise<{ action: ModerationAction; targetUpdated: boolean; message: string }> {
    const action = await this.moderationRepository.create({
      actorId: moderatorId,
      targetId: dto.reportIds[0],
      targetType: ModerationTargetType.REPORT as any,
      action: ModerationActionType.MERGE as any,
      reason: dto.reason,
      metadata: { mergedReportIds: dto.reportIds.slice(1) },
    });
    return { action, targetUpdated: true, message: `Merged reports` };
  }

  async getAuditTrail(targetId: string): Promise<ModerationAction[]> {
    return this.moderationRepository.getActionHistoryForTarget(targetId);
  }

  async getModeratorStats(moderatorId: string, since?: Date): Promise<Record<string, number>> {
    return {};
  }

  private async hideTargetInternal(targetId: string, targetType: ModerationTargetType): Promise<boolean> {
    return true;
  }
}
