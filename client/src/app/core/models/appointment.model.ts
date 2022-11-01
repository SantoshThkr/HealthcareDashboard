export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'SCHEDULED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
];

export interface PersonRef {
  id: number;
  firstName: string;
  lastName: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  notes: string | null;
  patient?: PersonRef;
  doctor?: PersonRef;
}
