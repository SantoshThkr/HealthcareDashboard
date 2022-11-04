import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { DoctorFormComponent } from './doctor-form/doctor-form.component';
import { DoctorListComponent } from './doctor-list/doctor-list.component';

const routes: Routes = [
  { path: '', component: DoctorListComponent, data: { title: 'Doctors' } },
  { path: 'new', component: DoctorFormComponent, data: { title: 'Add doctor' } },
  { path: ':id/edit', component: DoctorFormComponent, data: { title: 'Edit doctor' } },
];

@NgModule({
  declarations: [DoctorListComponent, DoctorFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class DoctorsModule {}
