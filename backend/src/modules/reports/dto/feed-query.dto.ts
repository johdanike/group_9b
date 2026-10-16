import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportCategory, ReportState } from '../interfaces/report.interface.js';

export class FeedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @Max(100000)
  radius?: number;
  @IsOptional()
  @IsEnum(ReportCategory)
  category?: ReportCategory;
  @IsOptional()
  @IsEnum(ReportState)
  state?: ReportState;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
  @IsOptional()
  @IsISO8601()
  since?: string;
}
