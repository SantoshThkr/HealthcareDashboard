import request from 'supertest';

import app from '../src/app';
import { AuditLog, Doctor, sequelize, User } from '../src/models';
import { bearer, createDoctor, createUser, PASSWORD, resetDatabase, tokenFor } from './helpers';

let admin: User;
let adminToken: string;

beforeEach(async () => {
  await resetDatabase();
  admin = await createUser('ADMIN');
  adminToken = tokenFor(admin);
});

afterAll(() => sequelize.close());

describe('User management authorization', () => {
  it.each(['STAFF', 'DOCTOR'] as const)('rejects %s users', async (role) => {
    const user = await createUser(role);
    const token = tokenFor(user);

    const list = await request(app)
      .get('/api/users')
      .set(...bearer(token));
    const update = await request(app)
      .put(`/api/users/${admin.id}`)
      .set(...bearer(token))
      .send({ role: 'STAFF' });
    const promote = await request(app)
      .put(`/api/users/${user.id}`)
      .set(...bearer(token))
      .send({ role: 'ADMIN' });

    expect(list.status).toBe(403);
    expect(update.status).toBe(403);
    expect(promote.status).toBe(403);
    await admin.reload();
    expect(admin.role).toBe('ADMIN');
  });

  it('does not let admins change their own role', async () => {
    const res = await request(app)
      .put(`/api/users/${admin.id}`)
      .set(...bearer(adminToken))
      .send({ role: 'STAFF' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You cannot change your own role');
  });

  it('does not let admins deactivate themselves', async () => {
    const res = await request(app)
      .put(`/api/users/${admin.id}`)
      .set(...bearer(adminToken))
      .send({ isActive: false });

    expect(res.status).toBe(403);
  });
});

describe('Admin user flows', () => {
  it('creates a doctor account linked to a profile', async () => {
    const doctor = await createDoctor();

    const res = await request(app)
      .post('/api/users')
      .set(...bearer(adminToken))
      .send({
        firstName: 'New',
        lastName: 'Doctor',
        email: 'new.doctor@example.com',
        password: 'Welcome123',
        role: 'DOCTOR',
        doctorId: doctor.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.doctorProfile).toMatchObject({ id: doctor.id });
    await doctor.reload();
    expect(doctor.userId).toBe(res.body.data.id);
    expect(await AuditLog.count({ where: { action: 'CREATE_USER' } })).toBe(1);
  });

  it('will not link a doctor profile that belongs to someone else', async () => {
    const owner = await createUser('DOCTOR');
    const doctor = await createDoctor({ userId: owner.id });
    const other = await createUser('DOCTOR');

    const res = await request(app)
      .put(`/api/users/${other.id}`)
      .set(...bearer(adminToken))
      .send({ doctorId: doctor.id });

    expect(res.status).toBe(400);
    expect(res.body.errors.doctorId).toMatch(/already linked/);
  });

  it('unlinks the profile when a doctor becomes staff', async () => {
    const user = await createUser('DOCTOR');
    const doctor = await createDoctor({ userId: user.id });

    await request(app)
      .put(`/api/users/${user.id}`)
      .set(...bearer(adminToken))
      .send({ role: 'STAFF' });

    expect((await Doctor.findByPk(doctor.id))!.userId).toBeNull();
  });

  it('deactivates a user, which blocks sign in and existing sessions', async () => {
    const user = await createUser('STAFF');
    const token = tokenFor(user);

    const res = await request(app)
      .put(`/api/users/${user.id}`)
      .set(...bearer(adminToken))
      .send({ isActive: false });
    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD });
    expect(login.status).toBe(403);

    const me = await request(app)
      .get('/api/auth/me')
      .set(...bearer(token));
    expect(me.status).toBe(401);
  });

  it('resets a password', async () => {
    const user = await createUser('STAFF');

    await request(app)
      .put(`/api/users/${user.id}`)
      .set(...bearer(adminToken))
      .send({ password: 'BrandNew123' });

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD });
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'BrandNew123' });

    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  it('rejects weak passwords', async () => {
    const res = await request(app)
      .post('/api/users')
      .set(...bearer(adminToken))
      .send({
        firstName: 'A',
        lastName: 'B',
        email: 'a@example.com',
        password: 'short',
        role: 'STAFF',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors.password).toBeDefined();
  });
});
