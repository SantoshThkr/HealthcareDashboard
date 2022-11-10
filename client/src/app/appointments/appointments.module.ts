import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { AppointmentFormComponent } from './appointment-form/appointment-form.component';
import { AppointmentListComponent } from './appointment-list/appointment-list.component';

const routes: Routes = [
  { path: '', component: AppointmentListComponent, data: { title: 'Appointments' } },
  { path: 'new', component: AppointmentFormComponent, data: { title: 'New appointment' } },
  { path: ':id/edit', component: AppointmentFormComponent, data: { title: 'Edit appointment' } },
];

@NgModule({
  declarations: [AppointmentListComponent, AppointmentFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AppointmentsModule {}
