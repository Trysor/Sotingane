import { NgModule } from '@angular/core';

// Router
import { RouterModule } from '@angular/router';

// Modules
import { SharedModule } from '@app/modules/shared-module/shared.module';
import { CommonModule } from '@app/modules//common-module/common.module';

// Components
// import { LoginComponent } from './login-component/login.component';
import { AuthComponent } from './auth-component/auth.component';


@NgModule({
	declarations: [
		// LoginComponent,
		AuthComponent
	],
	imports: [
		RouterModule.forChild([ { path: '', component: AuthComponent, pathMatch: 'full' } ]),
		SharedModule,
		CommonModule
	]
})
export class AuthModule { }
