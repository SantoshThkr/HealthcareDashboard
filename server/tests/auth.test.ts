import request from 'supertest';

import app from '../src/app';
import { AuditLog, sequelize, User } from '../src/models';
import { bearer, createUser, expiredTokenFor, PASSWORD, resetDatabase, tokenFor } from './helpers';

beforeEach(resetDatabase);
afterAll(() => sequelize.close());

describe('POST /api/auth/register', () => {
  it('creates an inactive staff account', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'New',
      lastName: 'Person',
      email: 'New.Person@Example.com',
      password: 'secret123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      email: 'new.person@example.com',
      role: 'STAFF',
      isActive: false,
    });
    expect(res.body.data.passwordHash).toBeUndefined();

    const user = await User.findOne({ where: { email: 'new.person@example.com' } });
    expect(user!.passwordHash).not.toBe('secret123');
  });

  it('ignores a requested role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Sneaky',
      lastName: 'User',
      email: 'sneaky@example.com',
      password: 'secret123',
      role: 'ADMIN',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('STAFF');
  });

  it('returns field errors for invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstName: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(Object.keys(res.body.errors)).toEqual(
      expect.arrayContaining(['firstName', 'lastName', 'email', 'password'])
    );
  });

  it('rejects an email that is already registered', async () => {
    await createUser('STAFF', { email: 'taken@example.com' });

    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Dup',
      lastName: 'User',
      email: 'taken@example.com',
      password: 'secret123',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors.email).toMatch(/already registered/);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token and the user without the password hash', async () => {
    const user = await createUser('ADMIN', { email: 'admin@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ADMIN@example.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ id: user.id, role: 'ADMIN' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(await AuditLog.count({ where: { action: 'LOGIN', userId: user.id } })).toBe(1);
  });

  it('rejects a wrong password with a generic message', async () => {
    await createUser('STAFF', { email: 'staff@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@example.com', password: 'wrong-password1' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Invalid email or password' });
  });

  it('rejects an unknown email with the same message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('blocks inactive accounts', async () => {
    await createUser('STAFF', { email: 'pending@example.com', isActive: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pending@example.com', password: PASSWORD });

    expect(res.status).toBe(403);
  });

  it('validates the request body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nope' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual({
      email: 'Invalid email',
      password: 'Password is required',
    });
  });
});

describe('GET /api/auth/me', () => {
  it('requires a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set(...bearer('not.a.token'));
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid authentication token');
  });

  it('rejects an expired token', async () => {
    const user = await createUser('STAFF');

    const res = await request(app)
      .get('/api/auth/me')
      .set(...bearer(expiredTokenFor(user)));

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/);
  });

  it('rejects the token of a deactivated user', async () => {
    const user = await createUser('STAFF');
    const token = tokenFor(user);
    await user.update({ isActive: false });

    const res = await request(app)
      .get('/api/auth/me')
      .set(...bearer(token));

    expect(res.status).toBe(401);
  });

  it('returns the current user', async () => {
    const user = await createUser('STAFF');

    const res = await request(app)
      .get('/api/auth/me')
      .set(...bearer(tokenFor(user)));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, email: user.email });
  });
});

describe('POST /api/auth/logout', () => {
  it('records the logout', async () => {
    const user = await createUser('STAFF');

    const res = await request(app)
      .post('/api/auth/logout')
      .set(...bearer(tokenFor(user)));

    expect(res.status).toBe(200);
    expect(await AuditLog.count({ where: { action: 'LOGOUT', userId: user.id } })).toBe(1);
  });
});
