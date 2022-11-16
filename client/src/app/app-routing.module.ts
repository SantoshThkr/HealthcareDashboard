import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
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
        loadChildren: () => import('./doctors/doctors.module').then((m) => m.DoctorsModule),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./appointments/appointments.module').then((m) => m.AppointmentsModule),
      },
      {
        path: 'medical-records',
        loadChildren: () =>
          import('./medical-records/medical-records.module').then((m) => m.MedicalRecordsModule),
      },
      {
        path: 'users',
        loadChildren: () => import('./users/users.module').then((m) => m.UsersModule),
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
