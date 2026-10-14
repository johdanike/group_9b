import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from './entities/incident.entity.js';
import { IncidentReportLink } from './entities/incident-report-link.entity.js';
import { Confirmation } from './entities/confirmation.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, IncidentReportLink, Confirmation])],
  exports: [TypeOrmModule],
})
export class IncidentsModule {}