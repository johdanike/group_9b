import { Report } from '../reports/entities/report.entity.js';
import { Incident } from '../incidents/entities/incident.entity.js';
import { User } from '../identity/entities/user.entity.js';
import { IdentityModule } from '../identity/identity.module.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import { ModerationRepository } from './repositories/moderation.repository.js';
import { ModerationAction } from './entities/moderation-action.entity.js';

@Module({
  imports: [
    IdentityModule,
    TypeOrmModule.forFeature([ModerationAction, Report, Incident, User]),
  ],
  controllers: [ModerationController],
  providers: [ModerationService, ModerationRepository],
  exports: [ModerationService, ModerationRepository],
})
export class ModerationModule {}
