import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '@env';

// Service Worker
import { WorkerService } from '@app/services';
import { ServiceWorkerModule } from '@angular/service-worker';


import { AppComponent } from './app.component';

// Directly load base module
import { BaseModule } from '@app/modules';
import { BaseRoutingModule } from '@app/modules/base-module/base.routing-module';


// const appRoutes: Routes = [
//   { path: '', loadChildren: 'app/modules/base-module/base.module#BaseModule' },
//   { path: '**', redirectTo: '', pathMatch: 'full' }
// ];

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule.withServerTransition({ appId: 'soting' }),
		BaseModule,
		BaseRoutingModule,
		// RouterModule.forRoot(appRoutes),
		ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production })
	],
	providers: [
		WorkerService,
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
