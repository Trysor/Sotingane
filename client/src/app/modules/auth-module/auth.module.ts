import { NgModule } from '@angular/core';

// Router
import { AuthRoutingModule } from './auth.routing-module';

// Modules
import { SharedModule } from '@app/modules/shared-module/shared.module';
import { CommonModule } from '@app/modules/common.module';

// Components
import { LoginComponent } from './login-component/login.component';
import { AuthComponent } from './auth-component/auth.component';


@NgModule({
	declarations: [
		LoginComponent,
		AuthComponent
	],
	imports: [
		AuthRoutingModule,
		SharedModule,
		CommonModule
	]
})
export class AuthModule { }
