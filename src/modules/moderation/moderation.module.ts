import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationAction } from './entities/moderation-action.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ModerationAction])],
  exports: [TypeOrmModule],
})
export class ModerationModule {}