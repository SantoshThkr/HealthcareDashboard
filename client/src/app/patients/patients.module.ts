import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { PatientDetailComponent } from './patient-detail/patient-detail.component';
import { PatientFormComponent } from './patient-form/patient-form.component';
import { PatientListComponent } from './patient-list/patient-list.component';

const routes: Routes = [
  { path: '', component: PatientListComponent, data: { title: 'Patients' } },
  { path: 'new', component: PatientFormComponent, data: { title: 'Add patient' } },
  { path: ':id', component: PatientDetailComponent, data: { title: 'Patient details' } },
  { path: ':id/edit', component: PatientFormComponent, data: { title: 'Edit patient' } },
];

@NgModule({
  declarations: [PatientListComponent, PatientFormComponent, PatientDetailComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PatientsModule {}
