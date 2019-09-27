import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserTransferStateModule } from '@angular/platform-browser';

import { ServiceWorkerModule } from '@angular/service-worker';

import { env } from '@env';
import { WorkerService } from '@app/services/http/worker.service';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
	imports: [
		BrowserAnimationsModule,
		AppModule,
		BrowserTransferStateModule,
		ServiceWorkerModule.register('/ngsw-worker.js', { enabled: env.production })
	],
	providers: [
		WorkerService,
	],
	bootstrap: [AppComponent]
})
export class AppBrowserModule { }
