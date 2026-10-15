import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from '../services/reports.service.js';
import { CreateReportDto, UpdateReportDto, ConfirmationDto } from '../dto/create-report.dto.js';
import type { ReportCategory, ReportState, FeedQueryParams } from '../interfaces/report.interface.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Request() req: any, @Body() createReportDto: CreateReportDto) {
    return this.reportsService.createReport(req.user.id, createReportDto);
  }

  @Get()
  async getFeed(@Query() query: FeedQueryParams) {
    return this.reportsService.getFeed(query);
  }

  @Get(':id')
  async getReport(@Param('id') id: string) {
    return this.reportsService.getReport(id);
  }

  @Put(':id')
  async updateReport(@Request() req: any, @Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.updateReport(req.user.id, id, updateReportDto);
  }

  @Post('confirm')
  async addConfirmation(@Request() req: any, @Body() confirmationDto: ConfirmationDto) {
    return this.reportsService.addConfirmation(req.user.id, confirmationDto);
  }

  @Delete(':id')
  async deleteReport(@Request() req: any, @Param('id') id: string) {
    await this.reportsService.deleteReport(req.user.id, id);
    return { message: 'Report deleted successfully' };
  }
}