import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { LoadState } from '../core/models/api.model';
import { APPOINTMENT_STATUSES, AppointmentStatus } from '../core/models/appointment.model';
import { Activity, DashboardSummary } from '../core/models/dashboard.model';
import { DashboardService } from '../core/services/dashboard.service';

interface StatCard {
  label: string;
  value: number;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  state: LoadState = 'loading';
  summary?: DashboardSummary;
  activity: Activity[] = [];
  stats: StatCard[] = [];
  statuses = APPOINTMENT_STATUSES;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state = 'loading';
    forkJoin({
      summary: this.dashboardService.getSummary(),
      activity: this.dashboardService.getRecentActivity(),
    }).subscribe(
      ({ summary, activity }) => {
        this.summary = summary;
        this.activity = activity;
        this.stats = [
          { label: 'Total Patients', value: summary.totals.patients, icon: 'people' },
          { label: 'Total Doctors', value: summary.totals.doctors, icon: 'medical_services' },
          { label: "Today's Appointments", value: summary.totals.todayAppointments, icon: 'today' },
          {
            label: 'Pending Appointments',
            value: summary.totals.pendingAppointments,
            icon: 'pending_actions',
          },
          {
            label: 'Completed Appointments',
            value: summary.totals.completedAppointments,
            icon: 'task_alt',
          },
        ];
        this.state = 'loaded';
      },
      () => (this.state = 'error')
    );
  }

  statusShare(status: AppointmentStatus): number {
    if (!this.summary) {
      return 0;
    }
    const counts = this.summary.appointmentsByStatus;
    const total = this.statuses.reduce((sum, s) => sum + counts[s], 0);
    return total ? Math.round((counts[status] / total) * 100) : 0;
  }
}
