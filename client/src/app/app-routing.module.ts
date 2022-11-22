import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './layout/layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'patients',
        loadChildren: () => import('./patients/patients.module').then((m) => m.PatientsModule),
      },
      {
        path: 'doctors',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'STAFF'] },
        loadChildren: () => import('./doctors/doctors.module').then((m) => m.DoctorsModule),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./appointments/appointments.module').then((m) => m.AppointmentsModule),
      },
      {
        path: 'medical-records',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'DOCTOR'] },
        loadChildren: () =>
          import('./medical-records/medical-records.module').then((m) => m.MedicalRecordsModule),
      },
      {
        path: 'users',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] },
        loadChildren: () => import('./users/users.module').then((m) => m.UsersModule),
      },
      {
        path: 'audit-logs',
        canLoad: [RoleGuard],
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] },
        loadChildren: () => import('./audit-logs/audit-logs.module').then((m) => m.AuditLogsModule),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
