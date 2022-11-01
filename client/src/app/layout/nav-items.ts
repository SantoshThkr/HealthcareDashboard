import { Role } from '../core/models/user.model';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard',
    roles: ['ADMIN', 'DOCTOR', 'STAFF'],
  },
  { label: 'Patients', icon: 'people', path: '/patients', roles: ['ADMIN', 'DOCTOR', 'STAFF'] },
  { label: 'Doctors', icon: 'medical_services', path: '/doctors', roles: ['ADMIN', 'STAFF'] },
  {
    label: 'Appointments',
    icon: 'event',
    path: '/appointments',
    roles: ['ADMIN', 'DOCTOR', 'STAFF'],
  },
  {
    label: 'Medical Records',
    icon: 'description',
    path: '/medical-records',
    roles: ['ADMIN', 'DOCTOR'],
  },
  { label: 'Users', icon: 'manage_accounts', path: '/users', roles: ['ADMIN'] },
  { label: 'Audit Logs', icon: 'history', path: '/audit-logs', roles: ['ADMIN'] },
];
