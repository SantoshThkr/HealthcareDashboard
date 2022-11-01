import { NgModule } from '@angular/core';
import { LayoutModule as CdkLayoutModule } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { SharedModule } from '../shared/shared.module';
import { HeaderComponent } from './header/header.component';
import { LayoutComponent } from './layout.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@NgModule({
  declarations: [LayoutComponent, HeaderComponent, SidebarComponent],
  imports: [SharedModule, CdkLayoutModule, MatSidenavModule, MatToolbarModule],
})
export class LayoutModule {}
