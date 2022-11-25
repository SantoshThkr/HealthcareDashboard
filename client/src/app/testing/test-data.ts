import { defer, Observable } from 'rxjs';

import { Appointment } from '../core/models/appointment.model';
import { DashboardSummary } from '../core/models/dashboard.model';
import { Patient } from '../core/models/patient.model';
import { User } from '../core/models/user.model';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    firstName: 'Test',
    lastName: 'Admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: null,
    createdAt: '2021-06-01T10:00:00.000Z',
    ...overrides,
  };
}

export function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1984-03-12',
    gender: 'MALE',
    phone: '555-0200',
    email: 'john.doe@example.com',
    address: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    doctorId: 1,
    status: 'ACTIVE',
    doctor: { id: 1, firstName: 'Sarah', lastName: 'Smith', specialization: 'Cardiology' },
    ...overrides,
  };
}

export function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 1,
    patientId: 1,
    doctorId: 1,
    date: '2021-09-15',
    time: '09:00',
    reason: 'Follow-up',
    status: 'SCHEDULED',
    notes: null,
    patient: { id: 1, firstName: 'John', lastName: 'Doe' },
    doctor: { id: 1, firstName: 'Sarah', lastName: 'Smith' },
    ...overrides,
  };
}

export function makeSummary(): DashboardSummary {
  return {
    totals: {
      patients: 10,
      doctors: 3,
      todayAppointments: 4,
      pendingAppointments: 6,
      completedAppointments: 2,
    },
    appointmentSummary: { today: 4, upcoming: 3, completed: 2, cancelled: 1 },
    appointmentsByStatus: { SCHEDULED: 4, CONFIRMED: 2, COMPLETED: 2, CANCELLED: 1 },
    todayAppointments: [makeAppointment()],
    upcomingAppointments: [],
  };
}

export function fakeToken(expiresInSeconds = 3600): string {
  const payload = btoa(
    JSON.stringify({ sub: 1, role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + expiresInSeconds })
  );
  return `header.${payload}.signature`;
}

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => Promise.resolve(data));
}

export function asyncError(error: unknown): Observable<never> {
  return defer(() => Promise.reject(error));
}
