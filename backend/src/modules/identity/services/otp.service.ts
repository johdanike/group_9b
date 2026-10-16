import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface OtpRecord {
  id: string;
  phone: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpStore = new Map<string, OtpRecord>();
  private readonly maxAttempts = 3;
  private readonly otpTtlMinutes = 5;
  private readonly rateLimitWindowMinutes = 15;
  private readonly maxOtpsPerWindow = 3;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.cleanupExpiredOtps();
  }

  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.rateLimitWindowMinutes * 60 * 1000);

    const recentOtps = Array.from(this.otpStore.values()).filter(
      (otp) => otp.phone === phone && otp.createdAt > windowStart,
    );

    if (recentOtps.length >= this.maxOtpsPerWindow) {
      return {
        success: false,
        message: `Too many OTP requests. Please wait ${this.rateLimitWindowMinutes} minutes.`,
      };
    }

    const code = this.generateOtp();
    const expiresAt = new Date(now.getTime() + this.otpTtlMinutes * 60 * 1000);

    const record: OtpRecord = {
      id: crypto.randomUUID(),
      phone,
      code,
      expiresAt,
      attempts: 0,
      createdAt: now,
    };

    this.otpStore.set(phone, record);

    this.logger.log(`OTP sent to ${phone}: ${code}`);

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  }

  async verifyOtp(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    const record = this.otpStore.get(phone);

    if (!record) {
      return { success: false, message: 'No OTP found for this phone number' };
    }

    if (record.expiresAt < new Date()) {
      this.otpStore.delete(phone);
      return { success: false, message: 'OTP has expired' };
    }

    if (record.attempts >= this.maxAttempts) {
      this.otpStore.delete(phone);
      return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    record.attempts++;

    if (record.code !== code) {
      this.otpStore.set(phone, record);
      return { success: false, message: 'Invalid OTP' };
    }

    this.otpStore.delete(phone);
    return { success: true, message: 'OTP verified successfully' };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private cleanupExpiredOtps(): void {
    setInterval(() => {
      const now = new Date();
      for (const [phone, record] of this.otpStore.entries()) {
        if (record.expiresAt < now) {
          this.otpStore.delete(phone);
        }
      }
    }, 60000);
  }
}