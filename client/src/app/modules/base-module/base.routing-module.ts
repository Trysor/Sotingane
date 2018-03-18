import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BaseComponent } from './base-component/base.component';
import { SearchResultsComponent } from './search-results-component/search.results.component';
// External
import { ContentComponent } from '@app/modules/content-module/content-component/content.component';


// Guards
import { CmsResolver, SearchResolver, AuthGuard, AdminGuard, LoginGuard } from '@app/guards';

const routes: Routes = [
	{
		path: '', component: BaseComponent,
		children: [
			// admin routes
			{ path: 'compose', loadChildren: 'app/modules/compose-module/compose.module#ComposeModule', canActivate: [AdminGuard] },
			{ path: 'admin', loadChildren: 'app/modules/admin-module/admin.module#AdminModule', canActivate: [AdminGuard] },
			// generic routes
			{ path: 'login', loadChildren: 'app/modules/auth-module/auth.module#AuthModule', pathMatch: 'full', canActivate: [LoginGuard] },
			{ path: 'steam', loadChildren: 'app/modules/steam-module/steam.module#SteamModule' },
			{ path: 'search', redirectTo: 'search/', pathMatch: 'full', data: { SearchResults: '' } },
			{ path: 'search/:term', component: SearchResultsComponent, resolve: { SearchResults: SearchResolver } },
			// User routes (all users)
			{ path: 'user', loadChildren: 'app/modules/user-module/user.module#UserModule', pathMatch: 'full', canActivate: [AuthGuard] },
			// CMS routes
			{ path: '', redirectTo: 'home', pathMatch: 'full' },
			{ path: ':content', component: ContentComponent, resolve: { CmsContent: CmsResolver } },
		]
	},
];


@NgModule({
	imports: [
		RouterModule.forRoot(routes)
	],
	exports: [
		RouterModule
	]
})
export class BaseRoutingModule { }
