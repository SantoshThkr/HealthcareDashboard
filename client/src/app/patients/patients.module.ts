import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RoleGuard } from '../core/guards/role.guard';
import { SharedModule } from '../shared/shared.module';
import { PatientAppointmentsComponent } from './patient-appointments/patient-appointments.component';
import { PatientDetailComponent } from './patient-detail/patient-detail.component';
import { PatientFormComponent } from './patient-form/patient-form.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientRecordsComponent } from './patient-records/patient-records.component';

const routes: Routes = [
  { path: '', component: PatientListComponent, data: { title: 'Patients' } },
  {
    path: 'new',
    component: PatientFormComponent,
    canActivate: [RoleGuard],
    data: { title: 'Add patient', roles: ['ADMIN', 'STAFF'] },
  },
  { path: ':id', component: PatientDetailComponent, data: { title: 'Patient details' } },
  {
    path: ':id/edit',
    component: PatientFormComponent,
    canActivate: [RoleGuard],
    data: { title: 'Edit patient', roles: ['ADMIN', 'STAFF'] },
  },
];

@NgModule({
  declarations: [
    PatientListComponent,
    PatientFormComponent,
    PatientDetailComponent,
    PatientAppointmentsComponent,
    PatientRecordsComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PatientsModule {}
