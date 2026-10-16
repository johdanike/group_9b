import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import { ModerationRepository } from './repositories/moderation.repository.js';
import { ModerationAction } from './entities/moderation-action.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ModerationAction])],
  controllers: [ModerationController],
  providers: [ModerationService, ModerationRepository],
  exports: [ModerationService, ModerationRepository],
})
export class ModerationModule {}