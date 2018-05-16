import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserTransferStateModule } from '@angular/platform-browser';

import { ServiceWorkerModule } from '@angular/service-worker';

import { environment } from '@env';
import { WorkerService } from '@app/services';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
	imports: [
		BrowserAnimationsModule,
		AppModule,
		BrowserTransferStateModule,
		ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production })
	],
	providers: [
		WorkerService,
	],
	bootstrap: [AppComponent]
})
export class AppBrowserModule { }
