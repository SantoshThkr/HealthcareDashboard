import { Role } from './user.model';

export const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE_PATIENT',
  'UPDATE_PATIENT',
  'DELETE_PATIENT',
  'CREATE_DOCTOR',
  'UPDATE_DOCTOR',
  'DELETE_DOCTOR',
  'CREATE_APPOINTMENT',
  'UPDATE_APPOINTMENT',
  'CANCEL_APPOINTMENT',
  'DELETE_APPOINTMENT',
  'CREATE_MEDICAL_RECORD',
  'UPDATE_MEDICAL_RECORD',
  'CREATE_USER',
  'UPDATE_USER',
];

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  entity: string;
  entityId: number | null;
  createdAt: string;
  user?: { id: number; firstName: string; lastName: string; email: string; role: Role } | null;
}
