import request from 'supertest';

import app from '../src/app';
import { AuditLog, Patient, sequelize } from '../src/models';
import {
  bearer,
  createAppointment,
  createDoctor,
  createDoctorUser,
  createPatient,
  createUser,
  daysFromToday,
  resetDatabase,
  tokenFor,
} from './helpers';

const validPatient = {
  firstName: 'Ava',
  lastName: 'Hughes',
  dateOfBirth: '2001-04-22',
  gender: 'FEMALE',
  phone: '555-0207',
  email: 'ava.hughes@example.com',
  status: 'ACTIVE',
};

let staffToken: string;
let adminToken: string;

beforeEach(async () => {
  await resetDatabase();
  staffToken = tokenFor(await createUser('STAFF'));
  adminToken = tokenFor(await createUser('ADMIN'));
});

afterAll(() => sequelize.close());

describe('Patient CRUD', () => {
  it('lets staff register a patient and records an audit entry', async () => {
    const doctor = await createDoctor();

    const res = await request(app)
      .post('/api/patients')
      .set(...bearer(staffToken))
      .send({ ...validPatient, doctorId: doctor.id });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ firstName: 'Ava', doctorId: doctor.id });
    expect(res.body.data.doctor).toMatchObject({ id: doctor.id });
    expect(
      await AuditLog.count({ where: { action: 'CREATE_PATIENT', entityId: res.body.data.id } })
    ).toBe(1);
  });

  it('returns field errors for invalid data', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set(...bearer(staffToken))
      .send({
        ...validPatient,
        email: 'bad',
        phone: 'abc',
        dateOfBirth: daysFromToday(2),
        firstName: 'x'.repeat(51),
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, message: 'Validation failed' });
    expect(res.body.errors).toEqual({
      email: 'Invalid email',
      phone: 'Phone must be a valid phone number',
      dateOfBirth: 'Date of birth must be between 1900 and today',
      firstName: 'First name must be at most 50 characters',
    });
  });

  it('rejects an unknown doctor', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set(...bearer(staffToken))
      .send({ ...validPatient, doctorId: 999 });

    expect(res.status).toBe(400);
    expect(res.body.errors.doctorId).toBeDefined();
  });

  it('updates a patient', async () => {
    const patient = await createPatient();

    const res = await request(app)
      .put(`/api/patients/${patient.id}`)
      .set(...bearer(staffToken))
      .send({ ...validPatient, status: 'INACTIVE' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ lastName: 'Hughes', status: 'INACTIVE' });
    expect(await AuditLog.count({ where: { action: 'UPDATE_PATIENT' } })).toBe(1);
  });

  it('returns 404 for a missing patient', async () => {
    const res = await request(app)
      .get('/api/patients/12345')
      .set(...bearer(staffToken));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Patient not found' });
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app)
      .get('/api/patients/abc')
      .set(...bearer(staffToken));
    expect(res.status).toBe(400);
  });

  it('only lets admins delete patients', async () => {
    const patient = await createPatient();

    const asStaff = await request(app)
      .delete(`/api/patients/${patient.id}`)
      .set(...bearer(staffToken));
    expect(asStaff.status).toBe(403);

    const asAdmin = await request(app)
      .delete(`/api/patients/${patient.id}`)
      .set(...bearer(adminToken));
    expect(asAdmin.status).toBe(200);
    expect(await Patient.count()).toBe(0);
  });

  it('refuses to delete a patient with appointment history', async () => {
    const patient = await createPatient();
    await createAppointment(patient.id, (await createDoctor()).id);

    const res = await request(app)
      .delete(`/api/patients/${patient.id}`)
      .set(...bearer(adminToken));

    expect(res.status).toBe(409);
  });
});

describe('GET /api/patients', () => {
  beforeEach(async () => {
    await createPatient({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' });
    await createPatient({ firstName: 'Jane', lastName: 'Roe', status: 'INACTIVE' });
    await createPatient({ firstName: 'Liam', lastName: 'Turner' });
  });

  it('paginates and sorts by name', async () => {
    const res = await request(app)
      .get('/api/patients?page=1&pageSize=2&sortBy=name&sortDir=asc')
      .set(...bearer(staffToken));

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.items.map((p: Patient) => p.lastName)).toEqual(['Doe', 'Roe']);
  });

  it('searches by full name', async () => {
    const res = await request(app)
      .get('/api/patients?search=john%20d')
      .set(...bearer(staffToken));

    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].lastName).toBe('Doe');
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/patients?status=INACTIVE')
      .set(...bearer(staffToken));

    expect(res.body.data.items.map((p: Patient) => p.firstName)).toEqual(['Jane']);
  });

  it('validates query parameters', async () => {
    const res = await request(app)
      .get('/api/patients?pageSize=1000&status=UNKNOWN')
      .set(...bearer(staffToken));

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(expect.arrayContaining(['pageSize', 'status']));
  });
});

describe('Doctor access to patients', () => {
  it('only lists assigned patients and patients with appointments', async () => {
    const { doctor, token } = await createDoctorUser();
    const assigned = await createPatient({ doctorId: doctor.id });
    const booked = await createPatient();
    await createPatient();
    await createAppointment(booked.id, doctor.id);

    const res = await request(app)
      .get('/api/patients')
      .set(...bearer(token));

    expect(res.body.data.items.map((p: Patient) => p.id).sort()).toEqual(
      [assigned.id, booked.id].sort()
    );
  });

  it('forbids viewing other patients', async () => {
    const { token } = await createDoctorUser();
    const other = await createPatient();

    const res = await request(app)
      .get(`/api/patients/${other.id}`)
      .set(...bearer(token));

    expect(res.status).toBe(403);
  });

  it('forbids doctors from creating patients', async () => {
    const { token } = await createDoctorUser();

    const res = await request(app)
      .post('/api/patients')
      .set(...bearer(token))
      .send(validPatient);

    expect(res.status).toBe(403);
  });
});
