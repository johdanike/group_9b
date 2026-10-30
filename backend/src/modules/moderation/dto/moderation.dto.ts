import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModerationActionType {
  REVIEW = 'review',
  APPROVE = 'approve',
  REJECT = 'reject',
  MERGE = 'merge',
  SPLIT = 'split',
  LABEL = 'label',
  RESTRICT = 'restrict',
  REMOVE = 'remove',
  HIDE = 'hide',
  ESCALATE = 'escalate',
}

export enum ModerationTargetType {
  REPORT = 'report',
  INCIDENT = 'incident',
  USER = 'user',
  EVIDENCE = 'evidence',
}

export enum AppealStatus {
  NONE = 'none',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum ReportState {
  UNVERIFIED = 'unverified',
  UNDER_REVIEW = 'under_review',
  CORROBORATED = 'corroborated',
  VERIFIED = 'verified',
  DISPUTED = 'disputed',
  STALE = 'stale',
  RESOLVED = 'resolved',
  REMOVED = 'removed',
}

export class CreateModerationActionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetId: string;

  @ApiProperty({ enum: ModerationTargetType })
  @IsEnum(ModerationTargetType)
  targetType: ModerationTargetType;

  @ApiProperty({ enum: ModerationActionType })
  @IsEnum(ModerationActionType)
  action: ModerationActionType;

  @ApiProperty({ minLength: 10, maxLength: 1000 })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({
    description: 'New state for the target (e.g., Verified, Removed)',
  })
  @IsOptional()
  @IsString()
  newState?: string;

  @ApiPropertyOptional({
    description: 'Related entity ID (e.g., incident ID for merged reports)',
  })
  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateModerationActionDto {
  @ApiPropertyOptional({ minLength: 10, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional({ enum: AppealStatus })
  @IsOptional()
  @IsEnum(AppealStatus)
  appealStatus?: AppealStatus;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ModerationActionFilterDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetId?: string;

  @ApiPropertyOptional({ enum: ModerationTargetType })
  @IsOptional()
  @IsEnum(ModerationTargetType)
  targetType?: ModerationTargetType;

  @ApiPropertyOptional({ enum: ModerationActionType })
  @IsOptional()
  @IsEnum(ModerationActionType)
  action?: ModerationActionType;

  @ApiPropertyOptional({ enum: AppealStatus })
  @IsOptional()
  @IsEnum(AppealStatus)
  appealStatus?: AppealStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  since?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  until?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsString()
  limit?: string;
}

export class CreateAppealDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  moderationActionId: string;

  @ApiProperty({ minLength: 20, maxLength: 2000 })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  evidence?: Record<string, any>;
}

export class ReviewAppealDto {
  @ApiProperty({ enum: AppealStatus })
  @IsEnum(AppealStatus)
  decision: AppealStatus;

  @ApiProperty({ minLength: 10, maxLength: 1000 })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;
}

export class MergeReportsDto {
  @ApiProperty({ type: [String], minItems: 2 })
  @IsUUID(undefined, { each: true })
  reportIds: string[];

  @ApiProperty({ minLength: 10, maxLength: 1000 })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;
}

export class ModerationQueueItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ModerationTargetType })
  targetType: ModerationTargetType;

  @ApiProperty()
  targetPreview: string;

  @ApiProperty()
  targetState: string;

  @ApiProperty()
  submittedAt: Date;

  @ApiProperty()
  reporterId: string;

  @ApiProperty({ enum: ReportState })
  currentState: string;

  @ApiPropertyOptional()
  flagCount?: number;

  @ApiPropertyOptional()
  duplicateOf?: string;

  constructor(partial: Partial<ModerationQueueItemDto>) {
    Object.assign(this, partial);
  }
}
