import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ServerModule, ServerTransferStateModule } from '@angular/platform-server';
import { ModuleMapLoaderModule } from '@nguniversal/module-map-ngfactory-loader';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

import { ServerService } from '@app/services';

@NgModule({
	imports: [
		NoopAnimationsModule,
		// The AppServerModule should import your AppModule followed
		// by the ServerModule from @angular/platform-server.
		AppModule,
		ServerModule,
		ModuleMapLoaderModule,
		ServerTransferStateModule,
	],
	providers: [
		ServerService
	],
	// Since the bootstrapped component is not inherited from your
	// imported AppModule, it needs to be repeated here.
	bootstrap: [AppComponent],
})
export class AppServerModule { }
