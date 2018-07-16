import { NgModule } from '@angular/core';

// Router
import { AdminRoutingModule } from './admin.routing-module';

// Modules
import { SharedModule } from '@app/modules/shared-module/shared.module';
import { CommonModule } from '@app/modules/common.module';


// Components
import { AdminComponent } from './admin-component/admin.component';
import { SettingsComponent } from './settings-component/settings.component';
import { UsersComponent } from './users-component/users.component';
import { PagesComponent } from './pages-component/pages.component';
import { AnalyticsComponent } from './analytics-component/analytics.component';
import { UserModalComponent } from './user-modal-component/user.modal.component';

@NgModule({
	declarations: [
		AdminComponent,
		UsersComponent,
		PagesComponent,
		AnalyticsComponent,
		SettingsComponent,
		UserModalComponent
	],
	imports: [
		SharedModule,
		CommonModule,
		AdminRoutingModule
	],
	entryComponents: [
		UserModalComponent
	]
})
export class AdminModule { }
