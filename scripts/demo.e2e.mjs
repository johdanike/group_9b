import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import pg from 'pg';
import { writeFile } from 'node:fs/promises';
import { randomInt } from 'node:crypto';

if (
  process.env.DB_NAME !== 'neighbourhood_signal_demo' ||
  process.env.DEMO_MODE !== 'true'
)
  throw new Error('Use the local demo environment for this integration suite.');
const base = 'http://127.0.0.1:3100/api';
const db = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const users = [];
let backend;
let serverLog = '';
async function call(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}
async function login() {
  const phone = `+23481${randomInt(10000000, 99999999)}`;
  const sent = await call('/auth/send-otp', {
    method: 'POST',
    body: { phone },
  });
  assert.equal(sent.status, 200);
  const result = await call('/auth/verify-otp', {
    method: 'POST',
    body: { phone, otp: sent.data.demoOtp },
  });
  assert.equal(result.status, 200);
  users.push(result.data.user.id);
  return { ...result.data, phone, token: result.data.accessToken };
}
before(async () => {
  await db.connect();
  backend = spawn(process.execPath, ['backend/dist/main.js'], {
    env: { ...process.env, PORT: '3100' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  backend.stdout.on('data', (chunk) => {
    serverLog += chunk;
  });
  backend.stderr.on('data', (chunk) => {
    serverLog += chunk;
  });
  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch(base)).ok) return;
    } catch {}
    if (backend.exitCode !== null) throw new Error(serverLog);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Backend did not start: ${serverLog}`);
});
after(async () => {
  await writeFile('.local/api-test.log', serverLog);
  if (backend) {
    backend.kill();
    await new Promise((resolve) => {
      if (backend.exitCode !== null) resolve();
      else backend.once('exit', resolve);
    });
  }
  if (users.length) {
    await db.query(
      'DELETE FROM notification_deliveries WHERE recipient = ANY($1::uuid[]) OR incident_id_or_sos_id IN (SELECT id FROM reports WHERE reporter_id = ANY($1::uuid[]))',
      [users],
    );
    await db.query(
      'DELETE FROM moderation_actions WHERE actor_id = ANY($1::uuid[]) OR target_id IN (SELECT id FROM reports WHERE reporter_id = ANY($1::uuid[]))',
      [users],
    );
    await db.query(
      'DELETE FROM confirmations WHERE user_id = ANY($1::uuid[]) OR report_id_or_incident_id IN (SELECT id FROM reports WHERE reporter_id = ANY($1::uuid[]))',
      [users],
    );
    await db.query('DELETE FROM reports WHERE reporter_id = ANY($1::uuid[])', [
      users,
    ]);
    await db.query(
      'DELETE FROM notification_subscriptions WHERE user_id = ANY($1::uuid[])',
      [users],
    );
    await db.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [users]);
  }
  await db.end();
});

test('frontend-facing API journey and trust boundaries', async (t) => {
  const author = await login();
  const witness = await login();
  const secondWitness = await login();
  const mod = await login();
  await db.query("UPDATE users SET role = 'moderator' WHERE id = $1", [
    mod.user.id,
  ]);
  const location = {
    latitude: 6.5158,
    longitude: 3.3711,
    areaName: 'Yaba',
    radius: 1000,
  };
  let report;
  await t.test('protected routes reject anonymous requests', async () => {
    assert.equal((await call('/auth/profile')).status, 401);
    assert.equal((await call('/notifications/inbox')).status, 401);
    assert.equal(
      (await call('/reports', { method: 'POST', body: {} })).status,
      401,
    );
  });
  await t.test('profiles cannot assign their own privileged role', async () => {
    assert.equal(
      (
        await call('/auth/complete-profile', {
          token: author.token,
          method: 'PUT',
          body: { displayName: 'Test resident', role: 'moderator' },
        })
      ).status,
      400,
    );
    assert.equal(
      (await call('/auth/profile', { token: author.token })).data.role,
      'resident',
    );
  });
  await t.test(
    'subscriptions support multiple categories and user ownership',
    async () => {
      for (const category of ['traffic', 'weather'])
        assert.equal(
          (
            await call('/notifications/subscriptions', {
              token: witness.token,
              method: 'POST',
              body: {
                category,
                areaOrRadius: 5,
                latitude: location.latitude,
                longitude: location.longitude,
              },
            })
          ).status,
          201,
        );
      const prefs = await call(
        `/notifications/subscriptions?userId=${author.user.id}`,
        { token: witness.token },
      );
      assert.equal(prefs.data.length, 2);
      assert.ok(prefs.data.every((s) => s.userId === witness.user.id));
    },
  );
  await t.test('malformed report and feed input is rejected', async () => {
    assert.equal(
      (
        await call('/reports', {
          token: author.token,
          method: 'POST',
          body: { category: 'traffic', description: 'Missing location' },
        })
      ).status,
      400,
    );
    assert.equal((await call('/reports?limit=-1')).status, 400);
    assert.equal((await call('/reports?latitude=6.5')).status, 400);
  });
  await t.test(
    'report creation persists an unverified public report',
    async () => {
      const created = await call('/reports', {
        token: author.token,
        method: 'POST',
        body: {
          category: 'traffic',
          description: 'Integration test: congestion around the bus stop.',
          location,
        },
      });
      assert.equal(created.status, 201);
      report = created.data;
      assert.equal(report.state, 'unverified');
    assert.ok(Math.abs(new Date(report.observedAt) - new Date(report.submittedAt)) < 5000, 'Observation and submission timestamps must share the same timezone semantics');
      assert.equal((await call(`/reports/${report.id}`)).data.id, report.id);
      assert.equal(report.reporter.phone, undefined);
      assert.equal(report.reporter.metadata, undefined);
      assert.notEqual(report.coordinates.coordinates[0], location.longitude);
    },
  );
  await t.test(
    'nearby filters use the report location, category and radius',
    async () => {
      const nearby = await call(
        '/reports?latitude=6.5158&longitude=3.3711&radius=1000&category=traffic',
      );
      assert.equal(
        nearby.status,
        200,
        JSON.stringify(nearby.data) + '\n' + serverLog,
      );
      assert.ok(nearby.data.some((r) => r.id === report.id));
      const farAway = await call('/reports?latitude=0&longitude=0&radius=1000');
      assert.ok(!farAway.data.some((r) => r.id === report.id));
    },
  );
  await t.test(
    'matching subscriber receives a saved in-app notification, others do not',
    async () => {
      const inbox = await call('/notifications/inbox', {
        token: witness.token,
      });
      const notification = inbox.data.find(
        (n) => n.incidentIdOrSosId === report.id,
      );
      assert.equal(notification.channel, 'in_app');
      assert.equal(notification.payload.reportId, report.id);
      assert.equal(
        (await call('/notifications/inbox', { token: secondWitness.token }))
          .data.length,
        0,
      );
      assert.equal(
        (
          await call(`/notifications/inbox/${notification.id}/read`, {
            token: author.token,
            method: 'PUT',
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call(`/notifications/inbox/${notification.id}/read`, {
            token: witness.token,
            method: 'PUT',
          })
        ).data.deliveryState,
        'acknowledged',
      );
    },
  );
  await t.test(
    'self-votes and confirmations without firsthand observation are rejected',
    async () => {
      assert.equal(
        (
          await call('/reports/confirm', {
            token: author.token,
            method: 'POST',
            body: { reportId: report.id, action: 'confirm', firsthand: true },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call('/reports/confirm', {
            token: witness.token,
            method: 'POST',
            body: { reportId: report.id, action: 'confirm' },
          })
        ).status,
        400,
      );
    },
  );
  await t.test(
    'duplicate and concurrent votes do not inflate counts',
    async () => {
      const vote = (token) =>
        call('/reports/confirm', {
          token,
          method: 'POST',
          body: { reportId: report.id, action: 'confirm', firsthand: true },
        });
      const responses = await Promise.all([
        vote(witness.token),
        vote(witness.token),
        vote(secondWitness.token),
      ]);
      assert.ok(responses.every((r) => r.status === 201));
      const result = (await call(`/reports/${report.id}`)).data;
      assert.equal(result.confirmationsCount, 2);
      assert.equal(result.state, 'corroborated');
    },
  );
  await t.test(
    'changing a vote replaces it and marks the report disputed',
    async () => {
      const changed = await call('/reports/confirm', {
        token: witness.token,
        method: 'POST',
        body: { reportId: report.id, action: 'dispute', firsthand: false },
      });
      assert.equal(changed.data.confirmationsCount, 1);
      assert.equal(changed.data.disputesCount, 1);
      assert.equal(changed.data.state, 'disputed');
    },
  );
  await t.test(
    'residents cannot impersonate a moderator with actorId',
    async () => {
      assert.equal(
        (
          await call(
            `/moderation/reports/${report.id}/approve?actorId=${mod.user.id}`,
            {
              token: author.token,
              method: 'POST',
              body: { reason: 'Reviewed the supporting firsthand accounts.' },
            },
          )
        ).status,
        403,
      );
    },
  );
  await t.test(
    'moderator verification updates state and writes an audit trail',
    async () => {
      const reviewed = await call('/moderation/actions', {
        token: mod.token,
        method: 'POST',
        body: {
          targetId: report.id,
          targetType: 'report',
          action: 'approve',
          newState: 'verified',
          reason: 'Reviewed the supporting firsthand accounts.',
        },
      });
      assert.equal(reviewed.status, 201);
      assert.equal(
        (await call(`/reports/${report.id}`)).data.state,
        'verified',
      );
      const audit = await call(`/moderation/audit/${report.id}`, {
        token: mod.token,
      });
      assert.equal(audit.data[0].actorId, mod.user.id);
    },
  );
  await t.test(
    'trusted contributor is earned at ten distinct currently verified reports',
    async () => {
      for (let i = 0; i < 9; i++) {
        const created = await call('/reports', {
          token: author.token,
          method: 'POST',
          body: {
            category: 'community',
            description: `Integration test verified contribution ${i + 2}.`,
            location,
          },
        });
        assert.equal(created.status, 201);
        const verified = await call('/moderation/actions', {
          token: mod.token,
          method: 'POST',
          body: {
            targetId: created.data.id,
            targetType: 'report',
            action: 'approve',
            newState: 'verified',
            reason: 'Reviewed this illustrative test report independently.',
          },
        });
        assert.equal(verified.status, 201);
        const profile = (await call('/auth/profile', { token: author.token }))
          .data;
        assert.equal(profile.trustedContributor, i === 8);
      }
      assert.equal(
        (await call('/auth/profile', { token: author.token })).data
          .verifiedReports,
        10,
      );
      assert.equal(
        (await call(`/reports/${report.id}`)).data.reporter.trustedContributor,
        true,
      );
    },
  );
  await t.test(
    'account status is checked on every authenticated request',
    async () => {
      await db.query(
        "UPDATE users SET account_status = 'suspended' WHERE id = $1",
        [secondWitness.user.id],
      );
      assert.equal(
        (await call('/auth/profile', { token: secondWitness.token })).status,
        401,
      );
    },
  );
});
