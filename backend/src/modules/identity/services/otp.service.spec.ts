import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service.js';

describe('local demo OTP adapter', () => {
  const phone = '+2348000000001';
  let service: OtpService;
  beforeEach(() => {
    vi.useFakeTimers();
    service = new OtpService(
      new ConfigService({ DEMO_MODE: 'true', NODE_ENV: 'development' }),
    );
  });
  afterEach(() => vi.useRealTimers());

  it('generates six digits and consumes a successful code', async () => {
    const { demoOtp } = await service.sendOtp(phone);
    expect(demoOtp).toMatch(/^\d{6}$/);
    expect((await service.verifyOtp(phone, demoOtp)).success).toBe(true);
    expect((await service.verifyOtp(phone, demoOtp)).success).toBe(false);
  });
  it('expires codes after five minutes', async () => {
    const { demoOtp } = await service.sendOtp(phone);
    vi.advanceTimersByTime(5 * 60000);
    expect((await service.verifyOtp(phone, demoOtp)).success).toBe(false);
  });
  it('limits repeated requests even though codes replace earlier records', async () => {
    for (let i = 0; i < 3; i++) await service.sendOtp(phone);
    await expect(service.sendOtp(phone)).rejects.toMatchObject({ status: 429 });
    vi.advanceTimersByTime(15 * 60000 + 1);
    await expect(service.sendOtp(phone)).resolves.toHaveProperty('demoOtp');
  });
  it('blocks a correct code after three wrong attempts', async () => {
    const { demoOtp } = await service.sendOtp(phone);
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
