import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum, ValidateNested, IsNumber, Min, Max, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportCategory } from '../interfaces/report.interface.js';

export class LocationDto {
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  radius?: number;

  @IsOptional()
  @IsString()
  areaName?: string;
}

export class CreateReportDto {
  @IsEnum(ReportCategory)
  category: ReportCategory;

  @IsString()
  @IsNotEmpty()
  description: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsString()
  observedAt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceReferences?: string[];
}

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportCategory)
  category?: ReportCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsString()
  observedAt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceReferences?: string[];
}

export class ConfirmationDto {
  @IsUUID()
  reportId: string;

  @IsEnum(['confirm', 'dispute'])
  action: 'confirm' | 'dispute';

  @IsOptional()
  @IsBoolean()
  firsthand?: boolean;
}