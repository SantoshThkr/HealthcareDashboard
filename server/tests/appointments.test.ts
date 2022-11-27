import request from 'supertest';

import app from '../src/app';
import { Appointment, AuditLog, Doctor, Patient, sequelize } from '../src/models';
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

let staffToken: string;
let patient: Patient;
let doctor: Doctor;

beforeEach(async () => {
  await resetDatabase();
  staffToken = tokenFor(await createUser('STAFF'));
  patient = await createPatient();
  doctor = await createDoctor();
});

afterAll(() => sequelize.close());

function book(overrides: Record<string, unknown> = {}) {
  return request(app)
    .post('/api/appointments')
    .set(...bearer(staffToken))
    .send({
      patientId: patient.id,
      doctorId: doctor.id,
      date: daysFromToday(3),
      time: '09:30',
      reason: 'Annual check-up',
      ...overrides,
    });
}

describe('Creating appointments', () => {
  it('schedules an appointment', async () => {
    const res = await book();

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      status: 'SCHEDULED',
      time: '09:30',
      patient: { id: patient.id },
      doctor: { id: doctor.id },
    });
    expect(await AuditLog.count({ where: { action: 'CREATE_APPOINTMENT' } })).toBe(1);
  });

  it('validates required fields and formats', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set(...bearer(staffToken))
      .send({ date: daysFromToday(-1), time: '25:00' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toMatchObject({
      patientId: 'Patient is required',
      doctorId: 'Doctor is required',
      date: 'Date cannot be in the past',
      time: 'Time must be in HH:mm format',
      reason: 'Reason is required',
    });
  });

  it('prevents double booking a doctor', async () => {
    await book();
    const other = await createPatient();

    const res = await book({ patientId: other.id });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already has an appointment/);
  });

  it('allows reusing the slot of a cancelled appointment', async () => {
    await createAppointment(patient.id, doctor.id, {
      date: daysFromToday(3),
      time: '09:30',
      status: 'CANCELLED',
    });

    const res = await book();

    expect(res.status).toBe(201);
  });

  it('rejects inactive doctors', async () => {
    await doctor.update({ status: 'ON_LEAVE' });

    const res = await book();

    expect(res.status).toBe(400);
    expect(res.body.errors.doctorId).toMatch(/not currently available/);
  });

  it('does not let doctors book appointments', async () => {
    const { token } = await createDoctorUser();

    const res = await request(app)
      .post('/api/appointments')
      .set(...bearer(token))
      .send({});

    expect(res.status).toBe(403);
  });
});

describe('Status changes', () => {
  it.each([
    ['SCHEDULED', 'CONFIRMED'],
    ['SCHEDULED', 'CANCELLED'],
    ['CONFIRMED', 'COMPLETED'],
    ['CONFIRMED', 'CANCELLED'],
  ])('allows %s -> %s', async (from, to) => {
    const appointment = await createAppointment(patient.id, doctor.id, { status: from as never });

    const res = await request(app)
      .put(`/api/appointments/${appointment.id}`)
      .set(...bearer(staffToken))
      .send({ status: to });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(to);
  });

  it.each([
    ['SCHEDULED', 'COMPLETED'],
    ['COMPLETED', 'CANCELLED'],
    ['CANCELLED', 'CONFIRMED'],
  ])('rejects %s -> %s', async (from, to) => {
    const appointment = await createAppointment(patient.id, doctor.id, { status: from as never });

    const res = await request(app)
      .put(`/api/appointments/${appointment.id}`)
      .set(...bearer(staffToken))
      .send({ status: to });

    expect(res.status).toBe(409);
  });

  it('records cancellations separately', async () => {
    const appointment = await createAppointment(patient.id, doctor.id);

    await request(app)
      .put(`/api/appointments/${appointment.id}`)
      .set(...bearer(staffToken))
      .send({ status: 'CANCELLED' });

    expect(await AuditLog.count({ where: { action: 'CANCEL_APPOINTMENT' } })).toBe(1);
    expect(await AuditLog.count({ where: { action: 'UPDATE_APPOINTMENT' } })).toBe(0);
  });

  it('lets a doctor update the status of their own appointment only', async () => {
    const { doctor: own, token } = await createDoctorUser();
    const mine = await createAppointment(patient.id, own.id, { status: 'CONFIRMED' });
    const theirs = await createAppointment(patient.id, doctor.id);

    const ok = await request(app)
      .put(`/api/appointments/${mine.id}`)
      .set(...bearer(token))
      .send({ status: 'COMPLETED', doctorId: doctor.id, reason: 'changed' });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({
      status: 'COMPLETED',
      doctorId: own.id,
      reason: 'Check-up',
    });

    const forbidden = await request(app)
      .put(`/api/appointments/${theirs.id}`)
      .set(...bearer(token))
      .send({ status: 'CONFIRMED' });
    expect(forbidden.status).toBe(403);
  });

  it('does not reschedule completed appointments', async () => {
    const appointment = await createAppointment(patient.id, doctor.id, { status: 'COMPLETED' });

    const res = await request(app)
      .put(`/api/appointments/${appointment.id}`)
      .set(...bearer(staffToken))
      .send({ date: daysFromToday(5) });

    expect(res.status).toBe(409);
  });
});

describe('Listing and deleting appointments', () => {
  it('filters by date, status and doctor', async () => {
    const other = await createDoctor();
    await createAppointment(patient.id, doctor.id, { date: daysFromToday(1) });
    await createAppointment(patient.id, doctor.id, { date: daysFromToday(2), status: 'CONFIRMED' });
    await createAppointment(patient.id, other.id, { date: daysFromToday(1), time: '11:00' });

    const byDate = await request(app)
      .get(`/api/appointments?date=${daysFromToday(1)}`)
      .set(...bearer(staffToken));
    expect(byDate.body.data.total).toBe(2);

    const byStatus = await request(app)
      .get('/api/appointments?status=CONFIRMED')
      .set(...bearer(staffToken));
    expect(byStatus.body.data.total).toBe(1);

    const byDoctor = await request(app)
      .get(`/api/appointments?doctorId=${other.id}`)
      .set(...bearer(staffToken));
    expect(byDoctor.body.data.items.map((a: Appointment) => a.doctorId)).toEqual([other.id]);
  });

  it('limits doctors to their own appointments', async () => {
    const { doctor: own, token } = await createDoctorUser();
    await createAppointment(patient.id, own.id);
    await createAppointment(patient.id, doctor.id);

    const res = await request(app)
      .get(`/api/appointments?doctorId=${doctor.id}`)
      .set(...bearer(token));

    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].doctorId).toBe(own.id);
  });

  it('only lets admins delete appointments', async () => {
    const appointment = await createAppointment(patient.id, doctor.id);

    const res = await request(app)
      .delete(`/api/appointments/${appointment.id}`)
      .set(...bearer(staffToken));

    expect(res.status).toBe(403);
    expect(await Appointment.count()).toBe(1);
  });
});
