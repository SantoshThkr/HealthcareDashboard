export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type PatientStatus = 'ACTIVE' | 'INACTIVE';

export const GENDERS: Gender[] = ['MALE', 'FEMALE', 'OTHER'];
export const PATIENT_STATUSES: PatientStatus[] = ['ACTIVE', 'INACTIVE'];

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  doctorId: number | null;
  status: PatientStatus;
  doctor?: { id: number; firstName: string; lastName: string; specialization: string } | null;
  createdAt?: string;
}

export type PatientPayload = Omit<Patient, 'id' | 'doctor' | 'createdAt'>;
