import { Appointment, AppointmentStatus } from './appointment.model';

export interface DashboardSummary {
  totals: {
    patients: number;
    doctors: number;
    todayAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
  };
  appointmentSummary: {
    today: number;
    upcoming: number;
    completed: number;
    cancelled: number;
  };
  appointmentsByStatus: Record<AppointmentStatus, number>;
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
}

export interface Activity {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  createdAt: string;
  description: string;
}
