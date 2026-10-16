import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from '../identity/decorators/current-user-id.decorator.js';
import { WebPushService } from './web-push.service.js';
import { SavePushDeviceDto, PushEndpointDto } from './dto/web-push.dto.js';

@Controller('notifications/push')
@UseGuards(AuthGuard('jwt'))
export class WebPushController {
  constructor(private readonly push: WebPushService) {}
  @Get('config') configuration() {
    return this.push.configuration();
  }
  @Post('devices') save(
    @CurrentUserId() userId: string,
    @Body() dto: SavePushDeviceDto,
  ) {
    return this.push.saveDevice(userId, dto);
  }
  @Delete('devices') remove(
    @CurrentUserId() userId: string,
    @Body() dto: PushEndpointDto,
  ) {
    return this.push.removeDevice(userId, dto.endpoint);
  }
  @Post('test') @HttpCode(200) test(
    @CurrentUserId() userId: string,
    @Body() dto: PushEndpointDto,
  ) {
    return this.push.testDevice(userId, dto.endpoint);
  }
}
