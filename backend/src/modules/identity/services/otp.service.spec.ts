import { mkdir, mkdtemp, readFile, unlink, rmdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service.js';

describe('local demo OTP adapter', () => {
  const phone = '+2348000000001';
  let service: OtpService;
  let folder: string;
  let mailbox: string;
  async function code() {
    return JSON.parse(await readFile(mailbox, 'utf8')).codes.find(
      (item: { phone: string }) => item.phone === phone,
    ).code as string;
  }
  beforeEach(async () => {
    await mkdir(resolve('.local'), { recursive: true });
    folder = await mkdtemp(resolve('.local/otp-test-'));
    mailbox = join(folder, 'codes.json');
    vi.useFakeTimers();
    service = new OtpService(
      new ConfigService({
        DEMO_MODE: 'true',
        NODE_ENV: 'development',
        DEMO_OTP_FILE: mailbox,
      }),
    );
  });
  afterEach(async () => {
    vi.useRealTimers();
    await unlink(mailbox).catch(() => {});
    await rmdir(folder);
  });

  it('generates six digits and consumes a successful code', async () => {
    const response = await service.sendOtp(phone);
    expect(response).not.toHaveProperty('demoOtp');
    const demoOtp = await code();
    expect(demoOtp).toMatch(/^\d{6}$/);
    expect((await service.verifyOtp(phone, demoOtp)).success).toBe(true);
    expect(JSON.parse(await readFile(mailbox, 'utf8')).codes).toEqual([]);
    expect((await service.verifyOtp(phone, demoOtp)).success).toBe(false);
  });
  it('expires codes after five minutes', async () => {
    const response = await service.sendOtp(phone);
    expect(response).not.toHaveProperty('demoOtp');
    const demoOtp = await code();
    vi.advanceTimersByTime(5 * 60000);
    expect((await service.verifyOtp(phone, demoOtp)).success).toBe(false);
  });
  it('limits repeated requests even though codes replace earlier records', async () => {
    for (let i = 0; i < 3; i++) await service.sendOtp(phone);
    await expect(service.sendOtp(phone)).rejects.toMatchObject({ status: 429 });
    vi.advanceTimersByTime(15 * 60000 + 1);
    await expect(service.sendOtp(phone)).resolves.toHaveProperty(
      'success',
      true,
    );
  });
  it('blocks a correct code after three wrong attempts', async () => {
    const response = await service.sendOtp(phone);
    expect(response).not.toHaveProperty('demoOtp');
    const demoOtp = await code();
    const wrong = demoOtp === '111111' ? '222222' : '111111';
    for (let i = 0; i < 3; i++)
      expect((await service.verifyOtp(phone, wrong)).success).toBe(false);
    expect((await service.verifyOtp(phone, demoOtp)).success).toBe(false);
  });
  it.each([
    { DEMO_MODE: 'false', NODE_ENV: 'development' },
    { DEMO_MODE: 'true', NODE_ENV: 'production' },
  ])('does not expose an OTP outside the local demo: %j', async (config) => {
    const disabled = new OtpService(new ConfigService(config));
    await expect(disabled.sendOtp(phone)).rejects.toMatchObject({
      status: 503,
    });
  });
});
