import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RoleGuard } from '../core/guards/role.guard';
import { SharedModule } from '../shared/shared.module';
import { AppointmentFormComponent } from './appointment-form/appointment-form.component';
import { AppointmentListComponent } from './appointment-list/appointment-list.component';

const routes: Routes = [
  { path: '', component: AppointmentListComponent, data: { title: 'Appointments' } },
  {
    path: 'new',
    component: AppointmentFormComponent,
    canActivate: [RoleGuard],
    data: { title: 'New appointment', roles: ['ADMIN', 'STAFF'] },
  },
  {
    path: ':id/edit',
    component: AppointmentFormComponent,
    canActivate: [RoleGuard],
    data: { title: 'Edit appointment', roles: ['ADMIN', 'STAFF'] },
  },
];

@NgModule({
  declarations: [AppointmentListComponent, AppointmentFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AppointmentsModule {}
