import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { Report } from './entities/report.entity.js';
import { EvidenceAsset } from './entities/evidence-asset.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Report, EvidenceAsset])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}