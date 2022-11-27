import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { Appointment, Doctor, MedicalRecord, Patient, sequelize, User } from '../src/models';
import { Role } from '../src/models/user';
import { formatDate } from '../src/utils/dates';
import { signToken } from '../src/utils/token';

export const PASSWORD = 'Password123!';

let passwordHash: string;
let counter = 0;

export async function resetDatabase(): Promise<void> {
  await sequelize.query(
    'TRUNCATE audit_logs, medical_records, appointments, patients, doctors, users RESTART IDENTITY CASCADE'
  );
}

export function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export async function createUser(role: Role, overrides: Partial<User> = {}): Promise<User> {
  passwordHash = passwordHash || (await bcrypt.hash(PASSWORD, 4));
  counter += 1;
  return User.create({
    firstName: 'Test',
    lastName: `${role.toLowerCase()}${counter}`,
    email: `${role.toLowerCase()}${counter}@example.com`,
    passwordHash,
    role,
    ...overrides,
  });
}

export async function createDoctor(overrides: Partial<Doctor> = {}): Promise<Doctor> {
  counter += 1;
  return Doctor.create({
    firstName: 'Greg',
    lastName: `House${counter}`,
    email: `doctor.profile${counter}@example.com`,
    phone: '555-0100',
    specialization: 'Diagnostics',
    department: 'General Medicine',
    licenseNumber: `LIC-${counter}`,
    ...overrides,
  });
}

export async function createDoctorUser(): Promise<{ user: User; doctor: Doctor; token: string }> {
  const user = await createUser('DOCTOR');
  const doctor = await createDoctor({ userId: user.id });
  return { user, doctor, token: tokenFor(user) };
}

export async function createPatient(overrides: Partial<Patient> = {}): Promise<Patient> {
  counter += 1;
  return Patient.create({
    firstName: 'Pat',
    lastName: `Ient${counter}`,
    dateOfBirth: '1980-01-01',
    gender: 'OTHER',
    phone: '555-0200',
    ...overrides,
  });
}

export async function createAppointment(
  patientId: number,
  doctorId: number,
  overrides: Partial<Appointment> = {}
): Promise<Appointment> {
  return Appointment.create({
    patientId,
    doctorId,
    date: daysFromToday(1),
    time: '10:00',
    reason: 'Check-up',
    ...overrides,
  });
}

export async function createRecord(
  patientId: number,
  doctorId: number,
  overrides: Partial<MedicalRecord> = {}
): Promise<MedicalRecord> {
  return MedicalRecord.create({
    patientId,
    doctorId,
    visitDate: daysFromToday(-1),
    diagnosis: 'Demo diagnosis',
    ...overrides,
  });
}

export function tokenFor(user: User): string {
  return signToken({ sub: user.id, role: user.role });
}

export function expiredTokenFor(user: User): string {
  return jwt.sign(
    { sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) - 60 },
    process.env.JWT_SECRET as string
  );
}

export function bearer(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}
