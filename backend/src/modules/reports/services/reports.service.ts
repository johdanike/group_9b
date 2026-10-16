import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Report } from '../entities/report.entity.js';
import { Confirmation } from '../../incidents/entities/confirmation.entity.js';
import { ReportsRepository } from '../repositories/reports.repository.js';
import {
  CreateReportDto,
  UpdateReportDto,
  ConfirmationDto,
} from '../dto/create-report.dto.js';
import { ReportState } from '../interfaces/report.interface.js';
import type { FeedQueryParams } from '../interfaces/report.interface.js';
import { NotificationsService } from '../../notifications/notifications.service.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private readonly reports: Repository<Report>,
    private readonly repository: ReportsRepository,
    private readonly db: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  async createReport(userId: string, dto: CreateReportDto) {
    if (dto.description.trim().length < 10)
      throw new BadRequestException(
        'Description needs at least 10 non-padding characters.',
      );
    if (dto.evidenceReferences?.length)
      throw new BadRequestException(
        'Evidence uploads are not enabled in the local demo.',
      );
    const observedAt = dto.observedAt ? new Date(dto.observedAt) : new Date();
    if (observedAt.getTime() > Date.now() + 60000)
      throw new BadRequestException('Observed time cannot be in the future.');
    const report = await this.db.transaction(async (manager) => {
      const report = await manager.save(
        Report,
        manager.create(Report, {
          reporterId: userId,
          category: dto.category,
          description: dto.description.trim(),
          observedAt,
          coordinatesOrArea: {
            type: 'Point',
            coordinates: [dto.location.longitude, dto.location.latitude],
          },
          locationPrecision: 'approximate',
          evidenceReferences: [],
          metadata: { areaName: dto.location.areaName || 'Selected area' },
          state: ReportState.UNVERIFIED,
        }),
      );
      await this.notifications.notifyReport(report, manager);
      return report;
    });
    return this.getReport(report.id);
  }

  async getReport(id: string) {
    const report = await this.repository.findById(id);
    if (!report || report.state === ReportState.REMOVED)
      throw new NotFoundException('Report not found');
    return this.present(report);
  }

  async getFeed(params: FeedQueryParams) {
    if ((params.latitude === undefined) !== (params.longitude === undefined))
      throw new BadRequestException(
        'Latitude and longitude must be supplied together.',
      );
    return Promise.all(
      (await this.repository.findForFeed(params)).map((report) =>
        this.present(report),
      ),
    );
  }

  private async present(report: Report) {
    const verifiedReports = await this.reports.count({
      where: { reporterId: report.reporterId, state: ReportState.VERIFIED },
    });
    return {
      id: report.id,
      category: report.category,
      description: report.description,
      reporterId: report.reporterId,
      observedAt: report.observedAt,
      submittedAt: report.submittedAt,
      areaName: report.metadata?.areaName || 'Lagos',
      locationPrecision: report.locationPrecision,
      coordinates: {
        type: 'Point',
        coordinates: report.coordinatesOrArea.coordinates.map(
          (n) => Math.round(n * 100) / 100,
        ),
      },
      state: report.state,
      confirmationsCount: report.confirmationsCount,
      disputesCount: report.disputesCount,
      reporter: {
        id: report.reporterId,
        displayName: report.reporter?.displayName || 'Resident',
        verifiedReports,
        trustedContributor: verifiedReports >= 10,
      },
    };
  }

  async updateReport(userId: string, id: string, dto: UpdateReportDto) {
    const report = await this.reports.findOneBy({ id });
    if (!report) throw new NotFoundException('Report not found');
    if (report.reporterId !== userId)
      throw new ForbiddenException('You can only update your own reports');
    if (report.state !== ReportState.UNVERIFIED)
      throw new BadRequestException(
        'Reviewed reports cannot be edited. Submit an update as a new report.',
      );
    if (dto.description && dto.description.trim().length < 10)
      throw new BadRequestException(
        'Description needs at least 10 non-padding characters.',
      );
    if (dto.evidenceReferences?.length)
      throw new BadRequestException(
        'Evidence uploads are not enabled in the local demo.',
      );
    if (dto.description) report.description = dto.description.trim();
    if (dto.category) report.category = dto.category;
    if (dto.location) {
      report.coordinatesOrArea = {
        type: 'Point',
        coordinates: [dto.location.longitude, dto.location.latitude],
      };
      report.metadata = {
        ...report.metadata,
        areaName: dto.location.areaName || 'Selected area',
      };
    }
    if (dto.observedAt) {
      if (new Date(dto.observedAt).getTime() > Date.now() + 60000)
        throw new BadRequestException('Observed time cannot be in the future.');
      report.observedAt = new Date(dto.observedAt);
    }
    await this.reports.save(report);
    return this.getReport(id);
  }

  async addConfirmation(userId: string, dto: ConfirmationDto) {
    if (dto.action === 'confirm' && dto.firsthand !== true)
      throw new BadRequestException(
        'Confirm only what you witnessed firsthand.',
      );
    await this.db.transaction(async (manager) => {
      const report = await manager.findOne(Report, {
        where: { id: dto.reportId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!report) throw new NotFoundException('Report not found');
      if (report.reporterId === userId)
        throw new ForbiddenException('You cannot vote on your own report.');
      if (
        [ReportState.REMOVED, ReportState.RESOLVED, ReportState.STALE].includes(
          report.state as ReportState,
        )
      )
        throw new BadRequestException('This report is closed for voting.');
      const key = { userId, reportIdOrIncidentId: dto.reportId };
      const existing = await manager.findOneBy(Confirmation, key);
      if (existing) {
        existing.confirmationOrDispute = dto.action;
        existing.firsthandFlag = dto.firsthand || false;
        await manager.save(existing);
      } else {
        await manager.save(
          Confirmation,
          manager.create(Confirmation, {
            ...key,
            confirmationOrDispute: dto.action,
            firsthandFlag: dto.firsthand || false,
          }),
        );
      }
      report.confirmationsCount = await manager.countBy(Confirmation, {
        reportIdOrIncidentId: report.id,
        confirmationOrDispute: 'confirm',
      });
      report.disputesCount = await manager.countBy(Confirmation, {
        reportIdOrIncidentId: report.id,
        confirmationOrDispute: 'dispute',
      });
      // Votes indicate community confidence; only moderators can verify a report.
      if (report.state !== ReportState.VERIFIED) {
        report.state =
          report.disputesCount > 0
            ? ReportState.DISPUTED
            : report.confirmationsCount >= 2
              ? ReportState.CORROBORATED
              : ReportState.UNVERIFIED;
      }
      await manager.save(report);
    });
    return this.getReport(dto.reportId);
  }

  async deleteReport(userId: string, id: string) {
    const report = await this.reports.findOneBy({ id });
    if (!report) throw new NotFoundException('Report not found');
    if (report.reporterId !== userId)
      throw new ForbiddenException('You can only delete your own reports');
    await this.reports.update(id, { state: ReportState.REMOVED });
  }
}
