import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedQueryDto } from '../dto/feed-query.dto.js';
import { ReportsService } from '../services/reports.service.js';
import {
  CreateReportDto,
  UpdateReportDto,
  ConfirmationDto,
} from '../dto/create-report.dto.js';
import type {
  ReportCategory,
  ReportState,
  FeedQueryParams,
} from '../interfaces/report.interface.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createReport(
    @Request() req: any,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.reportsService.createReport(req.user.id, createReportDto);
  }

  @Get()
  async getFeed(@Query() query: FeedQueryDto) {
    return this.reportsService.getFeed(query);
  }

  @Get(':id')
  async getReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getReport(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateReport(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    return this.reportsService.updateReport(req.user.id, id, updateReportDto);
  }

  @Post('confirm')
  @UseGuards(AuthGuard('jwt'))
  async addConfirmation(
    @Request() req: any,
    @Body() confirmationDto: ConfirmationDto,
  ) {
    return this.reportsService.addConfirmation(req.user.id, confirmationDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteReport(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.reportsService.deleteReport(req.user.id, id);
    return { message: 'Report deleted successfully' };
  }
}
