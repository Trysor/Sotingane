import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Directly load base module
import { BaseModule } from '@app/modules';
import { BaseRoutingModule } from '@app/modules/base-module/base.routing-module';

// Interceptors
import { InterceptorService } from '@app/services/http/interceptor.service';

// const appRoutes: Routes = [
//   { path: '', loadChildren: 'app/modules/base-module/base.module#BaseModule' },
//   { path: '**', redirectTo: '', pathMatch: 'full' }
// ];

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule.withServerTransition({ appId: 'soting' }), // must be in app.module
		BaseModule,
		BaseRoutingModule,
		// RouterModule.forRoot(appRoutes),
	],
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
