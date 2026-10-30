import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import webPush from 'web-push';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { WebPushDevice } from './entities/web-push-device.entity.js';
import { NotificationDelivery } from './entities/notification-delivery.entity.js';
import { SavePushDeviceDto } from './dto/web-push.dto.js';

@Injectable()
export class WebPushService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebPushService.name);
  private publicKey = '';
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(WebPushDevice)
    private readonly devices: Repository<WebPushDevice>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveries: Repository<NotificationDelivery>,
    private readonly db: DataSource,
  ) {}

  async onModuleInit() {
    let publicKey = this.config.get<string>('WEB_PUSH_PUBLIC_KEY');
    let privateKey = this.config.get<string>('WEB_PUSH_PRIVATE_KEY');
    if (
      (!publicKey || !privateKey) &&
      this.config.get('DEMO_MODE') === 'true' &&
      this.config.get('NODE_ENV') !== 'production'
    ) {
      const path = resolve(
        this.config.get<string>('DEMO_PUSH_KEYS_FILE') ||
          '.local/web-push-keys.json',
      );
      let keys: { publicKey: string; privateKey: string };
      try {
        keys = JSON.parse(await readFile(path, 'utf8'));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        keys = webPush.generateVAPIDKeys();
        await mkdir(dirname(path), { recursive: true });
        try {
          await writeFile(path, JSON.stringify(keys), {
            mode: 0o600,
            flag: 'wx',
          });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
          keys = JSON.parse(await readFile(path, 'utf8'));
        }
      }
      ({ publicKey, privateKey } = keys);
    }
    if (!publicKey || !privateKey) return;
    webPush.setVapidDetails(
      this.config.get('WEB_PUSH_SUBJECT') || 'mailto:demo@example.com',
      publicKey,
      privateKey,
    );
    this.publicKey = publicKey;
    if (this.config.get('WEB_PUSH_WORKER') !== 'false') {
      this.timer = setInterval(() => {
        void this.flush().catch(() =>
          this.logger.warn(
            'Web Push worker failed; pending deliveries will be retried.',
          ),
        );
      }, 3000);
      this.timer.unref();
    }
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  configuration() {
    return { enabled: Boolean(this.publicKey), publicKey: this.publicKey };
  }

  async saveDevice(userId: string, dto: SavePushDeviceDto) {
    if (!this.publicKey)
      throw new ServiceUnavailableException('Web Push is not configured.');
    const url = new URL(dto.endpoint);
    const host = url.hostname;
    const allowed =
      host === 'fcm.googleapis.com' ||
      host === 'web.push.apple.com' ||
      host.endsWith('.push.apple.com') ||
      host.endsWith('.push.services.mozilla.com') ||
      host.endsWith('.notify.windows.com');
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443') ||
      !allowed
    )
      throw new BadRequestException(
        'Unsupported browser push service endpoint.',
      );
    await this.devices.upsert(
      { userId, endpoint: dto.endpoint, keys: dto.keys, createdAt: new Date() },
      ['endpoint'],
    );
    return { success: true };
  }
  async removeDevice(userId: string, endpoint: string) {
    await this.devices.delete({ userId, endpoint });
    return { success: true };
  }
  async testDevice(userId: string, endpoint: string) {
    const device = await this.devices.findOneBy({ userId, endpoint });
    if (!device)
      throw new BadRequestException(
        'Enable notifications on this device first.',
      );
    const result = await this.send(device, {
      title: 'E don happen',
      body: 'Phone notifications are connected. New matching reports will appear here.',
      url: '/dashboard',
      tag: 'signal-test',
    });
    if (!result.accepted)
      throw new ServiceUnavailableException(
        'The push service did not accept this test. Try enabling notifications again.',
      );
    return {
      accepted: true,
      message:
        'Accepted by the browser push service. Device display depends on notification permissions and connectivity.',
    };
  }

  private async send(
    device: WebPushDevice,
    payload: object,
  ): Promise<{ accepted: boolean; retry: boolean }> {
    try {
      await webPush.sendNotification(
        { endpoint: device.endpoint, keys: device.keys },
        JSON.stringify(payload),
        { TTL: 300, timeout: 7000, urgency: 'normal' },
      );
      return { accepted: true, retry: false };
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410)
        await this.devices.delete({ id: device.id });
      // Do not log endpoints, device encryption keys or provider response bodies.
      this.logger.warn(
        `Push service did not accept a notification (${status || 'network error'}).`,
      );
      return {
        accepted: false,
        retry: !status || status === 429 || status >= 500,
      };
    }
  }

  async flush() {
    if (!this.publicKey || this.running) return;
    this.running = true;
    try {
      for (let i = 0; i < 20; i++) {
        const delivery = await this.db.transaction(async (manager) => {
          const item = await manager
            .getRepository(NotificationDelivery)
            .createQueryBuilder('d')
            .where("d.pushState IN ('queued', 'retry', 'sending')")
            .andWhere(
              '(d.pushNextAttemptAt IS NULL OR d.pushNextAttemptAt <= :now)',
              { now: new Date() },
            )
            .andWhere('d.pushAttempts <= 3')
            .orderBy('d.createdAt', 'ASC')
            .take(1)
            .setLock('pessimistic_write')
            .setOnLocked('skip_locked')
            .getOne();
          if (!item) return null;
          if (item.pushAttempts >= 3) {
            item.pushState = 'failed';
            await manager.save(item);
            return undefined;
          }
          item.pushState = 'sending';
          item.pushAttempts += 1;
          item.pushNextAttemptAt = new Date(Date.now() + 120000);
          return manager.save(item);
        });
        if (delivery === undefined) continue;
        if (delivery === null) break;
        const devices = await this.devices.findBy({
          userId: delivery.recipientId,
        });
        let accepted = false;
        let retry = false;
        for (const device of devices) {
          if (device.createdAt > delivery.createdAt) continue;
          const result = await this.send(device, {
            title: delivery.payload.title.slice(0, 120),
            body: delivery.payload.body.slice(0, 180),
            url: `/dashboard?report=${encodeURIComponent(delivery.payload.reportId)}`,
            tag: delivery.id,
          });
          accepted ||= result.accepted;
          retry ||= result.retry;
        }
        await this.deliveries.update(delivery.id, {
          pushState:
            retry && delivery.pushAttempts < 3
              ? 'retry'
              : accepted
                ? 'accepted'
                : devices.length
                  ? 'failed'
                  : 'no_device',
          pushNextAttemptAt: retry
            ? new Date(Date.now() + 30000 * delivery.pushAttempts)
            : null,
        });
      }
    } finally {
      this.running = false;
    }
  }
}
