export type DoctorStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';

export const DOCTOR_STATUSES: DoctorStatus[] = ['ACTIVE', 'ON_LEAVE', 'INACTIVE'];

export const DEPARTMENTS = [
  'Cardiology',
  'Dermatology',
  'Emergency',
  'General Medicine',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Radiology',
];

export interface Doctor {
  id: number;
  userId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  availability: string | null;
  status: DoctorStatus;
}

export type DoctorPayload = Omit<Doctor, 'id' | 'userId'>;
