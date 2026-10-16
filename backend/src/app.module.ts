import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { IncidentsModule } from './modules/incidents/incidents.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { SosModule } from './modules/sos/sos.module.js';
import { CommunityModule } from './modules/community/community.module.js';
import { ModerationModule } from './modules/moderation/moderation.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { RedisModule } from './redis/redis.module.js';
import appConfig from './config/app.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    RedisModule,
    IdentityModule,
    ReportsModule,
    IncidentsModule,
    NotificationsModule,
    SosModule,
    CommunityModule,
    ModerationModule,
    BillingModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
