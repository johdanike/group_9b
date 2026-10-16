import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
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

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'neighbourhood-signal',
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