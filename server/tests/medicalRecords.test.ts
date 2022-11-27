import request from 'supertest';

import app from '../src/app';
import { AuditLog, MedicalRecord, Patient, sequelize } from '../src/models';
import {
  bearer,
  createDoctorUser,
  createPatient,
  createRecord,
  createUser,
  daysFromToday,
  resetDatabase,
  tokenFor,
} from './helpers';

const validRecord = {
  visitDate: daysFromToday(0),
  diagnosis: 'Demo: seasonal allergy',
  symptoms: 'Sneezing',
  prescription: 'Demo prescription',
  followUpDate: daysFromToday(14),
};

let doctorToken: string;
let doctorId: number;
let patient: Patient;

beforeEach(async () => {
  await resetDatabase();
  const { doctor, token } = await createDoctorUser();
  doctorToken = token;
  doctorId = doctor.id;
  patient = await createPatient({ doctorId });
});

afterAll(() => sequelize.close());

describe('Creating medical records', () => {
  it('lets the assigned doctor add a record', async () => {
    const res = await request(app)
      .post(`/api/patients/${patient.id}/medical-records`)
      .set(...bearer(doctorToken))
      .send(validRecord);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ patientId: patient.id, doctorId });
    expect(await AuditLog.count({ where: { action: 'CREATE_MEDICAL_RECORD' } })).toBe(1);
  });

  it('forbids doctors from adding records for other patients', async () => {
    const other = await createPatient();

    const res = await request(app)
      .post(`/api/patients/${other.id}/medical-records`)
      .set(...bearer(doctorToken))
      .send(validRecord);

    expect(res.status).toBe(403);
  });

  it.each(['STAFF', 'ADMIN'] as const)('forbids %s users from adding records', async (role) => {
    const token = tokenFor(await createUser(role));

    const res = await request(app)
      .post(`/api/patients/${patient.id}/medical-records`)
      .set(...bearer(token))
      .send(validRecord);

    expect(res.status).toBe(403);
    expect(await MedicalRecord.count()).toBe(0);
  });

  it('validates dates and required fields', async () => {
    const res = await request(app)
      .post(`/api/patients/${patient.id}/medical-records`)
      .set(...bearer(doctorToken))
      .send({ visitDate: daysFromToday(1), followUpDate: daysFromToday(-5), diagnosis: '' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual({
      visitDate: 'Visit date cannot be in the future',
      diagnosis: 'Diagnosis is required',
      followUpDate: 'Follow-up date must be on or after the visit date',
    });
  });
});

describe('Reading medical records', () => {
  it('lets admins view records', async () => {
    await createRecord(patient.id, doctorId);
    const adminToken = tokenFor(await createUser('ADMIN'));

    const res = await request(app)
      .get(`/api/patients/${patient.id}/medical-records`)
      .set(...bearer(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('hides medical records from staff', async () => {
    await createRecord(patient.id, doctorId);
    const staffToken = tokenFor(await createUser('STAFF'));

    const nested = await request(app)
      .get(`/api/patients/${patient.id}/medical-records`)
      .set(...bearer(staffToken));
    const list = await request(app)
      .get('/api/medical-records')
      .set(...bearer(staffToken));

    expect(nested.status).toBe(403);
    expect(list.status).toBe(403);
  });

  it("scopes a doctor's record list to their patients", async () => {
    const other = await createDoctorUser();
    const otherPatient = await createPatient({ doctorId: other.doctor.id });
    await createRecord(patient.id, doctorId);
    await createRecord(otherPatient.id, other.doctor.id);

    const res = await request(app)
      .get('/api/medical-records')
      .set(...bearer(doctorToken));

    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].patientId).toBe(patient.id);
  });
});

describe('Updating medical records', () => {
  it('lets the author update the record', async () => {
    const record = await createRecord(patient.id, doctorId);

    const res = await request(app)
      .put(`/api/medical-records/${record.id}`)
      .set(...bearer(doctorToken))
      .send({ ...validRecord, notes: 'Improving' });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Improving');
    expect(await AuditLog.count({ where: { action: 'UPDATE_MEDICAL_RECORD' } })).toBe(1);
  });

  it('forbids other doctors from updating it', async () => {
    const record = await createRecord(patient.id, doctorId);
    const other = await createDoctorUser();

    const res = await request(app)
      .put(`/api/medical-records/${record.id}`)
      .set(...bearer(other.token))
      .send(validRecord);

    expect(res.status).toBe(403);
  });

  it('forbids staff from updating it', async () => {
    const record = await createRecord(patient.id, doctorId);
    const staffToken = tokenFor(await createUser('STAFF'));

    const res = await request(app)
      .put(`/api/medical-records/${record.id}`)
      .set(...bearer(staffToken))
      .send(validRecord);

    expect(res.status).toBe(403);
  });
});
