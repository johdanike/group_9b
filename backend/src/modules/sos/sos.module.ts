import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SOSRequest } from './entities/sos-request.entity.js';
import { SOSRecipient } from './entities/sos-recipient.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([SOSRequest, SOSRecipient])],
  exports: [TypeOrmModule],
})
export class SosModule {}