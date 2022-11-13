import { PersonRef } from './appointment.model';

export interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: number;
  visitDate: string;
  diagnosis: string;
  symptoms: string | null;
  prescription: string | null;
  notes: string | null;
  followUpDate: string | null;
  patient?: PersonRef;
  doctor?: PersonRef;
}

export type MedicalRecordPayload = Pick<
  MedicalRecord,
  'visitDate' | 'diagnosis' | 'symptoms' | 'prescription' | 'notes' | 'followUpDate'
>;
