import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthGuard } from '@app/guards';

import { ServerComponent } from './server-component/server.component';

import { SteamResolver } from '@app/guards';

@NgModule({
	imports: [
		RouterModule.forChild([
			{
				path: ':serverRoute', component: ServerComponent, resolve: { SteamServer: SteamResolver }
			}
		])
	],
	exports: [
		RouterModule
	]
})
export class SteamRoutingModule { }
