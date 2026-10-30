import { ReportsRepository } from './repositories/reports.repository.js';
import { User } from '../identity/entities/user.entity.js';
import { Confirmation } from '../incidents/entities/confirmation.entity.js';
import { IdentityModule } from '../identity/identity.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './controllers/reports.controller.js';
import { ReportsService } from './services/reports.service.js';
import { Report } from './entities/report.entity.js';
import { EvidenceAsset } from './entities/evidence-asset.entity.js';

@Module({
  imports: [
    IdentityModule,
    NotificationsModule,
    TypeOrmModule.forFeature([Report, EvidenceAsset, User, Confirmation]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
  exports: [ReportsService],
})
export class ReportsModule {}
