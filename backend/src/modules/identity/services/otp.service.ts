import {
  Injectable,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

@Injectable()
export class OtpService {
  private readonly otpStore = new Map<
    string,
    { code: string; expiresAt: number; attempts: number }
  >();
  private mailboxWrite: Promise<void> = Promise.resolve();
  private readonly requests = new Map<string, number[]>();
  constructor(private readonly config: ConfigService) {}

  async sendOtp(phone: string) {
    if (
      this.config.get('DEMO_MODE') !== 'true' ||
      this.config.get('NODE_ENV') === 'production'
    ) {
      throw new ServiceUnavailableException(
        'SMS provider is not configured. Local demo mode is required.',
      );
    }
    const now = Date.now();
    for (const [key, record] of this.otpStore)
      if (record.expiresAt <= now) this.otpStore.delete(key);
    for (const [key, times] of this.requests)
      if (times.every((t) => t <= now - 15 * 60000)) this.requests.delete(key);
    const recent = (this.requests.get(phone) || []).filter(
      (t) => t > now - 15 * 60000,
    );
    if (recent.length >= 3)
      throw new HttpException(
        'Too many OTP requests. Try again in 15 minutes.',
        429,
      );
    this.requests.set(phone, [...recent, now]);
    const code = String(randomInt(100000, 1000000));
    this.otpStore.set(phone, { code, expiresAt: now + 5 * 60000, attempts: 0 });
    await this.persistMailbox();
    return {
      success: true,
      message: 'Verification requested. Contact the demo host for your code.',
    };
  }

  private persistMailbox() {
    const path = resolve(
      this.config.get<string>('DEMO_OTP_FILE') || '.local/demo-otps.json',
    );
    this.mailboxWrite = this.mailboxWrite
      .catch(() => {})
      .then(async () => {
        const codes = [...this.otpStore]
          .filter(
            ([, item]) => item.expiresAt > Date.now() && item.attempts < 3,
          )
          .map(([phone, item]) => ({
            phone,
            code: item.code,
            expiresAt: new Date(item.expiresAt).toISOString(),
          }));
        await mkdir(dirname(path), { recursive: true });
        await writeFile(
          path + '.tmp',
          JSON.stringify(
            { updatedAt: new Date().toISOString(), codes },
            null,
            2,
          ) + '\n',
          { mode: 0o600 },
        );
        await rename(path + '.tmp', path);
      });
    return this.mailboxWrite;
  }

  async verifyOtp(phone: string, code: string) {
    const record = this.otpStore.get(phone);
    if (!record || record.expiresAt <= Date.now())
      return { success: false, message: 'Request a fresh code.' };
    if (record.attempts >= 3)
      return {
        success: false,
        message: 'Too many attempts. Request a fresh code.',
      };
    record.attempts++;
    if (record.code !== code) {
      await this.persistMailbox();
      return { success: false, message: 'Invalid code.' };
    }
    this.otpStore.delete(phone);
    await this.persistMailbox();
    return { success: true, message: 'Phone verified.' };
  }
}
