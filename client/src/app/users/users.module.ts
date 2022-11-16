import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { UserFormComponent } from './user-form/user-form.component';
import { UserListComponent } from './user-list/user-list.component';

const routes: Routes = [{ path: '', component: UserListComponent, data: { title: 'Users' } }];

@NgModule({
  declarations: [UserListComponent, UserFormComponent, ResetPasswordComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class UsersModule {}
