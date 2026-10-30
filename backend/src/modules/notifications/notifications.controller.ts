import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../identity/guards/roles.guard.js';
import { Roles } from '../identity/decorators/roles.decorator.js';
import { CurrentUserId } from '../identity/decorators/current-user-id.decorator.js';
import { UserRole } from '../identity/interfaces/identity.interface.js';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import type { EnqueueNotificationParams } from './notifications.service.js';
import { CreateNotificationSubscriptionDto } from './dto/create-notification-subscription.dto.js';
import { UpdateNotificationSubscriptionDto } from './dto/update-notification-subscription.dto.js';
import { NotificationSubscriptionResponseDto } from './dto/notification-subscription-response.dto.js';
import {
  CreateNotificationDeliveryDto,
  UpdateNotificationDeliveryDto,
  DeliveryChannel,
  DeliveryState,
  NotificationDeliveryFilterDto,
} from './dto/notification-delivery.dto.js';
import { NotificationDelivery } from './entities/notification-delivery.entity.js';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('inbox')
  @Roles(...Object.values(UserRole))
  async inbox(@CurrentUserId() userId: string) {
    return this.notificationsService.getDeliveriesByRecipient(userId);
  }

  @Put('inbox/:id/read')
  @Roles(...Object.values(UserRole))
  async read(@Param('id') id: string, @CurrentUserId() userId: string) {
    const delivery = await this.notificationsService.getDelivery(id);
    if (!delivery) throw new NotFoundException('Notification not found');
    if (delivery.recipientId !== userId)
      throw new ForbiddenException('This notification belongs to another user');
    return this.notificationsService.markDeliveryAcknowledged(id);
  }

  // Subscription endpoints
  @Post('subscriptions')
  @Roles(...Object.values(UserRole))
  @ApiOperation({ summary: 'Create or update notification subscription' })
  @ApiResponse({ status: 201, type: NotificationSubscriptionResponseDto })
  async createSubscription(
    @Body() dto: CreateNotificationSubscriptionDto,
    @CurrentUserId() userId: string,
  ): Promise<NotificationSubscriptionResponseDto> {
    return this.notificationsService.createSubscription(userId, dto);
  }

  @Get('subscriptions')
  @Roles(...Object.values(UserRole))
  @ApiOperation({ summary: 'Get all notification subscriptions for a user' })
  @ApiResponse({ status: 200, type: [NotificationSubscriptionResponseDto] })
  async getSubscriptions(
    @CurrentUserId() userId: string,
  ): Promise<NotificationSubscriptionResponseDto[]> {
    return this.notificationsService.getSubscriptions(userId);
  }

  @Get('subscriptions/:category')
  @Roles(...Object.values(UserRole))
  @ApiOperation({ summary: 'Get a specific notification subscription' })
  @ApiResponse({ status: 200, type: NotificationSubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getSubscription(
    @CurrentUserId() userId: string,
    @Param('category') category: string,
  ): Promise<NotificationSubscriptionResponseDto | null> {
    return this.notificationsService.getSubscription(userId, category);
  }

  @Put('subscriptions/:category')
  @Roles(...Object.values(UserRole))
  @ApiOperation({ summary: 'Update a notification subscription' })
  @ApiResponse({ status: 200, type: NotificationSubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async updateSubscription(
    @CurrentUserId() userId: string,
    @Param('category') category: string,
    @Body() dto: UpdateNotificationSubscriptionDto,
  ): Promise<NotificationSubscriptionResponseDto | null> {
    return this.notificationsService.updateSubscription(userId, category, dto);
  }

  @Delete('subscriptions/:category')
  @Roles(...Object.values(UserRole))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification subscription' })
  @ApiResponse({ status: 204, description: 'Subscription deleted' })
  async deleteSubscription(
    @CurrentUserId() userId: string,
    @Param('category') category: string,
  ): Promise<void> {
    return this.notificationsService.deleteSubscription(userId, category);
  }

  // Notification enqueueing (internal/admin use)
  @Post('enqueue')
  @ApiOperation({ summary: 'Enqueue notifications for an incident/SOS' })
  @ApiResponse({ status: 201, description: 'Notifications enqueued' })
  async enqueueNotification(@Body() params: EnqueueNotificationParams) {
    return this.notificationsService.enqueueNotification(params);
  }

  // Delivery endpoints
  @Get('deliveries/pending')
  @ApiOperation({ summary: 'Get pending deliveries for processing' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [NotificationDelivery] })
  async getPendingDeliveries(
    @Query('limit') limit?: number,
  ): Promise<NotificationDelivery[]> {
    return this.notificationsService.getPendingDeliveries(limit ?? 100);
  }

  @Get('deliveries/:id')
  @ApiOperation({ summary: 'Get a delivery by ID' })
  @ApiResponse({ status: 200, type: NotificationDelivery })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  async getDelivery(
    @Param('id') id: string,
  ): Promise<NotificationDelivery | null> {
    return this.notificationsService.getDelivery(id);
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'Filter notification deliveries' })
  @ApiResponse({ status: 200, description: 'Paginated delivery list' })
  async filterDeliveries(@Query() filters: NotificationDeliveryFilterDto) {
    return this.notificationsService.filterDeliveries(filters);
  }

  @Get('deliveries/incident/:incidentId')
  @ApiOperation({ summary: 'Get all deliveries for an incident' })
  @ApiResponse({ status: 200, type: [NotificationDelivery] })
  async getDeliveriesByIncident(
    @Param('incidentId') incidentId: string,
  ): Promise<NotificationDelivery[]> {
    return this.notificationsService.getDeliveriesByIncident(incidentId);
  }

  @Get('deliveries/user/:userId')
  @Roles(...Object.values(UserRole))
  @ApiOperation({ summary: 'Get all deliveries for a user' })
  @ApiResponse({ status: 200, type: [NotificationDelivery] })
  async getDeliveriesByRecipient(
    @CurrentUserId() userId: string,
  ): Promise<NotificationDelivery[]> {
    return this.notificationsService.getDeliveriesByRecipient(userId);
  }

  // Delivery state updates (called by provider webhooks or workers)
  @Put('deliveries/:id/sent')
  @ApiOperation({ summary: 'Mark delivery as sent' })
  @ApiResponse({ status: 200, type: NotificationDelivery })
  async markSent(
    @Param('id') id: string,
    @Body() body: { providerResponse?: any },
  ) {
    return this.notificationsService.markDeliverySent(
      id,
      body.providerResponse,
    );
  }

  @Put('deliveries/:id/delivered')
  @ApiOperation({ summary: 'Mark delivery as delivered' })
  @ApiResponse({ status: 200, type: NotificationDelivery })
  async markDelivered(
    @Param('id') id: string,
    @Body() body: { providerResponse?: any },
  ) {
    return this.notificationsService.markDeliveryDelivered(
      id,
      body.providerResponse,
    );
  }

  @Put('deliveries/:id/failed')
  @ApiOperation({ summary: 'Mark delivery as failed' })
  @ApiResponse({ status: 200, type: NotificationDelivery })
  async markFailed(
    @Param('id') id: string,
    @Body() body: { error: string; willRetry: boolean },
  ) {
    return this.notificationsService.markDeliveryFailed(
      id,
      body.error,
      body.willRetry,
    );
  }

  @Put('deliveries/:id/acknowledged')
  @ApiOperation({ summary: 'Mark delivery as acknowledged by user' })
  @ApiResponse({ status: 200, type: NotificationDelivery })
  async markAcknowledged(@Param('id') id: string) {
    return this.notificationsService.markDeliveryAcknowledged(id);
  }

  @Post('deliveries/retry')
  @ApiOperation({ summary: 'Retry failed deliveries' })
  @ApiQuery({ name: 'maxAttempts', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Number of deliveries retried' })
  async retryFailedDeliveries(
    @Query('maxAttempts') maxAttempts?: number,
  ): Promise<{ retried: number }> {
    const retried = await this.notificationsService.retryFailedDeliveries(
      maxAttempts ?? 3,
    );
    return { retried };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get delivery statistics' })
  @ApiQuery({
    name: 'since',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ApiResponse({ status: 200, description: 'Delivery statistics by state' })
  async getDeliveryStats(@Query('since') since?: string) {
    return this.notificationsService.getDeliveryStats(
      since ? new Date(since) : undefined,
    );
  }
}
