import request from 'supertest';

import app from '../src/app';
import { AuditLog, sequelize } from '../src/models';
import { bearer, createUser, daysFromToday, resetDatabase, tokenFor } from './helpers';

beforeEach(resetDatabase);
afterAll(() => sequelize.close());

describe('GET /api/audit-logs', () => {
  it('is only available to admins', async () => {
    const staffToken = tokenFor(await createUser('STAFF'));

    const res = await request(app)
      .get('/api/audit-logs')
      .set(...bearer(staffToken));

    expect(res.status).toBe(403);
  });

  it('filters by action, user and date', async () => {
    const admin = await createUser('ADMIN');
    const staff = await createUser('STAFF');
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await AuditLog.bulkCreate([
      { userId: staff.id, action: 'CREATE_PATIENT', entity: 'Patient', entityId: 1 },
      { userId: staff.id, action: 'UPDATE_PATIENT', entity: 'Patient', entityId: 1 },
      { userId: admin.id, action: 'CREATE_USER', entity: 'User', entityId: staff.id },
      {
        userId: staff.id,
        action: 'CREATE_PATIENT',
        entity: 'Patient',
        entityId: 2,
        createdAt: lastWeek,
      },
    ]);
    const token = tokenFor(admin);

    const byAction = await request(app)
      .get('/api/audit-logs?action=CREATE_PATIENT')
      .set(...bearer(token));
    expect(byAction.body.data.total).toBe(2);

    const byUser = await request(app)
      .get(`/api/audit-logs?userId=${admin.id}`)
      .set(...bearer(token));
    expect(byUser.body.data.items.map((log: AuditLog) => log.action)).toEqual(['CREATE_USER']);

    const byDate = await request(app)
      .get(`/api/audit-logs?action=CREATE_PATIENT&dateFrom=${daysFromToday(0)}`)
      .set(...bearer(token));
    expect(byDate.body.data.total).toBe(1);
    expect(byDate.body.data.items[0].user).toMatchObject({ id: staff.id });
  });

  it('rejects unknown actions', async () => {
    const token = tokenFor(await createUser('ADMIN'));

    const res = await request(app)
      .get('/api/audit-logs?action=HACK')
      .set(...bearer(token));

    expect(res.status).toBe(400);
  });
});
