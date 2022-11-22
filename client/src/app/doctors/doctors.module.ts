import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RoleGuard } from '../core/guards/role.guard';
import { SharedModule } from '../shared/shared.module';
import { DoctorFormComponent } from './doctor-form/doctor-form.component';
import { DoctorListComponent } from './doctor-list/doctor-list.component';

const routes: Routes = [
  { path: '', component: DoctorListComponent, data: { title: 'Doctors' } },
  {
    path: 'new',
    component: DoctorFormComponent,
    canActivate: [RoleGuard],
    data: { title: 'Add doctor', roles: ['ADMIN'] },
  },
  {
    path: ':id/edit',
    component: DoctorFormComponent,
    canActivate: [RoleGuard],
    data: { title: 'Edit doctor', roles: ['ADMIN'] },
  },
];

@NgModule({
  declarations: [DoctorListComponent, DoctorFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class DoctorsModule {}
