import request from 'supertest';

import app from '../src/app';
import { AuditLog, sequelize } from '../src/models';
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

beforeEach(resetDatabase);
afterAll(() => sequelize.close());

describe('GET /api/dashboard/summary', () => {
  it('summarises patients, doctors and appointments', async () => {
    const staff = await createUser('STAFF');
    const doctor = await createDoctor();
    const patient = await createPatient();
    await createPatient({ status: 'INACTIVE' });
    await createAppointment(patient.id, doctor.id, { date: daysFromToday(0), time: '09:00' });
    await createAppointment(patient.id, doctor.id, {
      date: daysFromToday(0),
      time: '10:00',
      status: 'COMPLETED',
    });
    await createAppointment(patient.id, doctor.id, { date: daysFromToday(2) });
    await createAppointment(patient.id, doctor.id, {
      date: daysFromToday(-2),
      status: 'CANCELLED',
    });

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set(...bearer(tokenFor(staff)));

    expect(res.status).toBe(200);
    expect(res.body.data.totals).toEqual({
      patients: 1,
      doctors: 1,
      todayAppointments: 2,
      pendingAppointments: 2,
      completedAppointments: 1,
    });
    expect(res.body.data.appointmentSummary).toEqual({
      today: 2,
      upcoming: 1,
      completed: 1,
      cancelled: 1,
    });
    expect(res.body.data.todayAppointments).toHaveLength(2);
    expect(res.body.data.upcomingAppointments).toHaveLength(1);
  });

  it("scopes a doctor's summary to their own work", async () => {
    const { doctor, token } = await createDoctorUser();
    const otherDoctor = await createDoctor();
    const mine = await createPatient({ doctorId: doctor.id });
    const theirs = await createPatient({ doctorId: otherDoctor.id });
    await createAppointment(mine.id, doctor.id, { date: daysFromToday(0) });
    await createAppointment(theirs.id, otherDoctor.id, { date: daysFromToday(0) });

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set(...bearer(token));

    expect(res.body.data.totals.patients).toBe(1);
    expect(res.body.data.totals.todayAppointments).toBe(1);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/dashboard/recent-activity', () => {
  it('describes recent actions without sign-in noise', async () => {
    const staff = await createUser('STAFF', { firstName: 'Emily', lastName: 'Clark' });
    const doctorUser = await createUser('DOCTOR', { lastName: 'Smith' });
    await AuditLog.bulkCreate([
      { userId: staff.id, action: 'LOGIN', entity: 'User', entityId: staff.id },
      { userId: staff.id, action: 'CREATE_PATIENT', entity: 'Patient', entityId: 1 },
      {
        userId: doctorUser.id,
        action: 'UPDATE_MEDICAL_RECORD',
        entity: 'MedicalRecord',
        entityId: 2,
      },
    ]);

    const res = await request(app)
      .get('/api/dashboard/recent-activity')
      .set(...bearer(tokenFor(staff)));

    const descriptions = res.body.data.map((item: { description: string }) => item.description);
    expect(descriptions).toEqual(
      expect.arrayContaining([
        'Emily Clark registered a new patient',
        'Dr. Smith updated a medical record',
      ])
    );
    expect(descriptions).toHaveLength(2);
  });
});
