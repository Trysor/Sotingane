import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Directly load base module
import { BaseModule } from '@app/modules/base-module/base.module';
import { MaterialDateModule } from '@app/modules/material.date.module';
import { BaseRoutingModule } from '@app/modules/base-module/base.routing-module';

// Services
import { InterceptorService } from '@app/services/http/interceptor.service';

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule.withServerTransition({ appId: 'soting' }), // must be in app.module
		// TransferHttpCacheModule,
		BaseModule,
		BaseRoutingModule,
		MaterialDateModule
	],
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true }
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
