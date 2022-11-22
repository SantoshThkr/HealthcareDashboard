import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RoleGuard } from '../core/guards/role.guard';
import { SharedModule } from '../shared/shared.module';
import { MedicalRecordFormComponent } from './medical-record-form/medical-record-form.component';
import { MedicalRecordListComponent } from './medical-record-list/medical-record-list.component';

const routes: Routes = [
  { path: '', component: MedicalRecordListComponent, data: { title: 'Medical records' } },
  {
    path: 'new',
    component: MedicalRecordFormComponent,
    canActivate: [RoleGuard],
    data: { title: 'Add medical record', roles: ['DOCTOR'] },
  },
  {
    path: ':id/edit',
    component: MedicalRecordFormComponent,
    canActivate: [RoleGuard],
    data: { title: 'Edit medical record', roles: ['DOCTOR'] },
  },
];

@NgModule({
  declarations: [MedicalRecordListComponent, MedicalRecordFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class MedicalRecordsModule {}
