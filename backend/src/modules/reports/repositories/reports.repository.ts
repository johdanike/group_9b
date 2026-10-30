import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, In } from 'typeorm';
import { Report } from '../entities/report.entity.js';
import type { FeedQueryParams } from '../interfaces/report.interface.js';
import {
  ReportCategory,
  ReportState,
  LocationPrecision,
} from '../interfaces/report.interface.js';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(report: Partial<Report>): Promise<Report> {
    const newReport = this.reportRepository.create(report);
    return this.reportRepository.save(newReport);
  }

  async findById(id: string): Promise<Report | null> {
    return this.reportRepository.findOne({
      where: { id },
      relations: ['reporter'],
      select: { reporter: { id: true, displayName: true } },
    });
  }

  async findForFeed(params: FeedQueryParams): Promise<Report[]> {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .leftJoin('report.reporter', 'reporter')
      .addSelect(['reporter.id', 'reporter.displayName'])
      .where('report.state IN (:...states)', {
        states: [
          ReportState.UNVERIFIED,
          ReportState.CORROBORATED,
          ReportState.VERIFIED,
          ReportState.DISPUTED,
          ReportState.RESOLVED,
        ],
      });

    if (
      params.latitude !== undefined &&
      params.longitude !== undefined &&
      params.radius !== undefined
    ) {
      query.andWhere(
        `ST_DWithin(report.coordinates_or_area::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius)`,
        { lat: params.latitude, lon: params.longitude, radius: params.radius },
      );
    }

    if (params.category) {
      query.andWhere('report.category = :category', {
        category: params.category,
      });
    }

    if (params.state) {
      query.andWhere('report.state = :state', { state: params.state });
    }

    if (params.since) {
      query.andWhere('report.submitted_at > :since', {
        since: new Date(params.since),
      });
    }

    query
      .orderBy('report.submittedAt', 'DESC')
      .take(params.limit || 20)
      .skip(params.offset || 0);

    return query.getMany();
  }

  async updateState(id: string, state: ReportState): Promise<void> {
    await this.reportRepository.update(id, { state });
  }

  async findDuplicates(
    category: ReportCategory,
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Report[]> {
    return this.reportRepository
      .createQueryBuilder('report')
      .where('report.category = :category', { category })
      .andWhere(
        `ST_DWithin(report.coordinates_or_area::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius)`,
        { lat: latitude, lon: longitude, radius: radiusKm * 1000 },
      )
      .andWhere('report.state IN (:...states)', {
        states: [
          ReportState.UNVERIFIED,
          ReportState.CORROBORATED,
          ReportState.VERIFIED,
        ],
      })
      .orderBy('report.submittedAt', 'DESC')
      .take(10)
      .getMany();
  }

  async incrementConfirmations(id: string): Promise<void> {
    await this.reportRepository.increment({ id }, 'confirmationsCount', 1);
  }

  async incrementDisputes(id: string): Promise<void> {
    await this.reportRepository.increment({ id }, 'disputesCount', 1);
  }
}
