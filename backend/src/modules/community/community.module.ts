import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Community } from './entities/community.entity.js';
import { Responder } from './entities/responder.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Community, Responder])],
  exports: [TypeOrmModule],
})
export class CommunityModule {}