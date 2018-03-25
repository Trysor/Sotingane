import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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
		BrowserModule.withServerTransition({ appId: 'soting' }), // must be in app.module
		BaseModule,
		BaseRoutingModule,
		// RouterModule.forRoot(appRoutes),
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
