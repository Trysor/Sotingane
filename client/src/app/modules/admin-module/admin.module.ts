import { NgModule } from '@angular/core';

// Router
import { RouterModule } from '@angular/router';

// Modules
import { SharedModule } from '@app/modules/shared-module/shared.module';
import { CommonModule } from '@app/modules//common-module/common.module';


// Components
import { AdminComponent } from './admin-component/admin.component';
import { SettingsComponent } from './settings-component/settings.component';
import { UsersComponent } from './users-component/users.component';
import { PagesComponent } from './pages-component/pages.component';
import { AnalyticsComponent } from './analytics-component/analytics.component';
import { FileStoreComponent } from './filestore-component/filestore.component';
import { UserModalComponent } from './user-modal-component/user.modal.component';
import { FileModalComponent } from './file-modal-component/file.modal.component';

@NgModule({
	declarations: [
		AdminComponent,
		UsersComponent,
		PagesComponent,
		AnalyticsComponent,
		SettingsComponent,
		FileStoreComponent,
		UserModalComponent,
		FileModalComponent
	],
	imports: [
		SharedModule,
		CommonModule,
		RouterModule.forChild([ { path: '', component: AdminComponent }	])
	]
})
export class AdminModule { }
