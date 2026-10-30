import { ConfigService } from '@nestjs/config';
import webPush from 'web-push';
import { WebPushService } from './web-push.service.js';

vi.mock('web-push', () => ({
  default: { sendNotification: vi.fn(), setVapidDetails: vi.fn() },
}));

describe('opt-in Web Push', () => {
  let service: WebPushService;
  let devices: any;
  let deliveries: any;
  let db: any;
  const keys = { auth: 'a'.repeat(22), p256dh: 'b'.repeat(87) };
  const device = {
    id: 'device-1',
    userId: 'resident-1',
    endpoint: 'https://fcm.googleapis.com/fcm/send/example',
    keys,
    createdAt: new Date(0),
  };
  beforeEach(async () => {
    vi.clearAllMocks();
    devices = {
      upsert: vi.fn(),
      delete: vi.fn(),
      findOneBy: vi.fn(),
      findBy: vi.fn().mockResolvedValue([device]),
    };
    deliveries = { update: vi.fn() };
    db = { transaction: vi.fn() };
    service = new WebPushService(
      new ConfigService({
        WEB_PUSH_PUBLIC_KEY: 'public',
        WEB_PUSH_PRIVATE_KEY: 'private',
        WEB_PUSH_WORKER: 'false',
      }),
      devices,
      deliveries,
      db,
    );
    await service.onModuleInit();
  });
  afterEach(() => service.onModuleDestroy());

  it('only returns the public key to the app', () => {
    expect(service.configuration()).toEqual({
      enabled: true,
      publicKey: 'public',
    });
  });
  it('stores a subscription against the authenticated user', async () => {
    await service.saveDevice('resident-1', { endpoint: device.endpoint, keys });
    expect(devices.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'resident-1',
        endpoint: device.endpoint,
      }),
      ['endpoint'],
    );
  });
  it.each([
    'http://fcm.googleapis.com/x',
    'https://127.0.0.1/private',
    'https://example.com/push',
    'https://fcm.googleapis.com.attacker.example/push',
    'https://user:password@fcm.googleapis.com/x',
  ])(
    'rejects endpoints outside browser push services: %s',
    async (endpoint) => {
      await expect(
        service.saveDevice('resident-1', { endpoint, keys }),
      ).rejects.toMatchObject({ status: 400 });
      expect(devices.upsert).not.toHaveBeenCalled();
    },
  );
  it('scopes subscription deletion to the current account', async () => {
    await service.removeDevice('resident-1', device.endpoint);
    expect(devices.delete).toHaveBeenCalledWith({
      userId: 'resident-1',
      endpoint: device.endpoint,
    });
  });
  it("cannot send a test to somebody else's device", async () => {
    devices.findOneBy.mockResolvedValue(null);
    await expect(
      service.testDevice('other-user', device.endpoint),
    ).rejects.toMatchObject({ status: 400 });
    expect(devices.findOneBy).toHaveBeenCalledWith({
      userId: 'other-user',
      endpoint: device.endpoint,
    });
    expect(webPush.sendNotification).not.toHaveBeenCalled();
  });
  it('reports provider acceptance without claiming device delivery', async () => {
    devices.findOneBy.mockResolvedValue(device);
    vi.mocked(webPush.sendNotification).mockResolvedValue({
      statusCode: 201,
    } as any);
    const result = await service.testDevice('resident-1', device.endpoint);
    expect(result.accepted).toBe(true);
    expect(result).not.toHaveProperty('delivered');
  });
  it('removes expired subscriptions after a 410 response', async () => {
    devices.findOneBy.mockResolvedValue(device);
    vi.mocked(webPush.sendNotification).mockRejectedValue({ statusCode: 410 });
    await expect(
      service.testDevice('resident-1', device.endpoint),
    ).rejects.toMatchObject({ status: 503 });
    expect(devices.delete).toHaveBeenCalledWith({ id: 'device-1' });
  });
  it('leases committed jobs and retries transient failures without changing inbox state', async () => {
    const delivery = {
      id: 'notification-1',
      recipientId: 'resident-1',
      createdAt: new Date(),
      pushAttempts: 0,
      payload: {
        title: 'Traffic',
        body: 'A nearby observation',
        reportId: 'report-1',
      },
    };
    const qb: any = {};
    for (const name of [
      'where',
      'andWhere',
      'orderBy',
      'take',
      'setLock',
      'setOnLocked',
    ])
      qb[name] = vi.fn().mockReturnValue(qb);
    qb.getOne = vi.fn().mockResolvedValueOnce(delivery).mockResolvedValue(null);
    db.transaction.mockImplementation((work: any) =>
      work({
        getRepository: () => ({ createQueryBuilder: () => qb }),
        save: vi.fn().mockImplementation((item: any) => item),
      }),
    );
    vi.mocked(webPush.sendNotification).mockRejectedValue({ statusCode: 503 });
    await service.flush();
    expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(qb.setOnLocked).toHaveBeenCalledWith('skip_locked');
    expect(deliveries.update).toHaveBeenCalledWith(
      'notification-1',
      expect.objectContaining({ pushState: 'retry' }),
    );
    expect(deliveries.update.mock.calls[0][1]).not.toHaveProperty(
      'deliveryState',
    );
  });
});
