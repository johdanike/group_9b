import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity.js';
import { EvidenceAsset } from '../entities/evidence-asset.entity.js';
import { User } from '../../identity/entities/user.entity.js';
import { ReportsRepository } from '../repositories/reports.repository.js';
import { CreateReportDto, UpdateReportDto, ConfirmationDto } from '../dto/create-report.dto.js';
import { ReportCategory, ReportState, LocationPrecision } from '../interfaces/report.interface.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(EvidenceAsset)
    private readonly evidenceAssetRepository: Repository<EvidenceAsset>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly reportsRepository: ReportsRepository,
  ) {}

  async createReport(userId: string, createReportDto: CreateReportDto): Promise<Report> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [longitude, latitude] = [createReportDto.location.longitude, createReportDto.location.latitude];
    
    const report = this.reportRepository.create({
      reporterId: userId,
      category: createReportDto.category,
      description: createReportDto.description,
      observedAt: createReportDto.observedAt ? new Date(createReportDto.observedAt) : new Date(),
      coordinatesOrArea: `POINT(${longitude} ${latitude})`,
      locationPrecision: createReportDto.location.radius ? LocationPrecision.APPROXIMATE : LocationPrecision.EXACT,
      evidenceReferences: createReportDto.evidenceReferences || [],
      state: ReportState.UNVERIFIED,
    });

    return this.reportRepository.save(report);
  }

  async getReport(id: string): Promise<Report> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async getFeed(params: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    category?: ReportCategory;
    state?: ReportState;
    limit?: number;
    offset?: number;
    since?: string;
  }): Promise<Report[]> {
    return this.reportsRepository.findForFeed(params);
  }

  async updateReport(userId: string, id: string, updateReportDto: UpdateReportDto): Promise<Report> {
    const report = await this.getReport(id);
    
    if (report.reporterId !== userId) {
      throw new BadRequestException('You can only update your own reports');
    }

    if (updateReportDto.location) {
      const [longitude, latitude] = [updateReportDto.location.longitude, updateReportDto.location.latitude];
      report.coordinatesOrArea = `POINT(${longitude} ${latitude})`;
      report.locationPrecision = updateReportDto.location.radius ? LocationPrecision.APPROXIMATE : LocationPrecision.EXACT;
    }

    if (updateReportDto.category) report.category = updateReportDto.category;
    if (updateReportDto.description) report.description = updateReportDto.description;
    if (updateReportDto.observedAt) report.observedAt = new Date(updateReportDto.observedAt);
    if (updateReportDto.evidenceReferences) report.evidenceReferences = updateReportDto.evidenceReferences;

    return this.reportRepository.save(report);
  }

  async addConfirmation(userId: string, confirmationDto: ConfirmationDto): Promise<Report> {
    const report = await this.getReport(confirmationDto.reportId);
    
    if (confirmationDto.action === 'confirm') {
      await this.reportsRepository.incrementConfirmations(confirmationDto.reportId);
      report.confirmationsCount = (report.confirmationsCount || 0) + 1;
      
      if (report.confirmationsCount >= 2 && report.state === ReportState.UNVERIFIED) {
        report.state = ReportState.CORROBORATED;
      }
    } else {
      await this.reportsRepository.incrementDisputes(confirmationDto.reportId);
      report.disputesCount = (report.disputesCount || 0) + 1;
      
      if (report.disputesCount >= 1 && report.state === ReportState.UNVERIFIED) {
        report.state = ReportState.DISPUTED;
      }
    }

    return this.reportRepository.save(report);
  }

  async deleteReport(userId: string, id: string): Promise<void> {
    const report = await this.getReport(id);
    
    if (report.reporterId !== userId) {
      throw new BadRequestException('You can only delete your own reports');
    }

    await this.reportRepository.remove(report);
  }
}