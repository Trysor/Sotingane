import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


// Service Worker
import { environment } from '@env';
import { WorkerService } from '@app/services';
import { ServiceWorkerModule } from '@angular/service-worker';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
	imports: [
		BrowserAnimationsModule,
		AppModule,
		ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production })
	],
	providers: [
		WorkerService,
	],
	bootstrap: [AppComponent]
})
export class AppBrowserModule { }
