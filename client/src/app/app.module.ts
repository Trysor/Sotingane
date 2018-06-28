import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TransferHttpCacheModule } from '@nguniversal/common';

// Directly load base module
import { BaseModule } from '@app/modules';
import { BaseRoutingModule } from '@app/modules/base-module/base.routing-module';

// Interceptors
import { InterceptorService } from '@app/services/http/interceptor.service';


@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule.withServerTransition({ appId: 'soting' }), // must be in app.module
		TransferHttpCacheModule,
		BaseModule,
		BaseRoutingModule
	],
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
