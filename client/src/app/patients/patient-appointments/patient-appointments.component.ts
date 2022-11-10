import { Component, Input, OnInit } from '@angular/core';

import { LoadState } from '../../core/models/api.model';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-patient-appointments',
  templateUrl: './patient-appointments.component.html',
})
export class PatientAppointmentsComponent implements OnInit {
  @Input() patientId!: number;

  columns = ['date', 'time', 'doctor', 'reason', 'status'];
  appointments: Appointment[] = [];
  state: LoadState = 'loading';
  canBook = this.auth.hasRole('ADMIN', 'STAFF');

  constructor(private appointmentService: AppointmentService, private auth: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state = 'loading';
    this.appointmentService.list({ patientId: this.patientId, pageSize: 50 }).subscribe(
      (page) => {
        this.appointments = page.items;
        this.state = page.items.length ? 'loaded' : 'empty';
      },
      () => (this.state = 'error')
    );
  }
}
