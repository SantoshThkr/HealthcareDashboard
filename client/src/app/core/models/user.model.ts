export type Role = 'ADMIN' | 'DOCTOR' | 'STAFF';

export const ROLES: Role[] = ['ADMIN', 'DOCTOR', 'STAFF'];

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  doctorProfile?: { id: number } | null;
}
