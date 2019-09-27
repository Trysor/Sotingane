import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BaseComponent } from './base-component/base.component';
import { ContentComponent } from '@app/modules/content-module/content-component/content.component';


// Guards
import { AuthGuard, AdminGuard, LoginGuard, RedirectGuard } from '@app/guards';

@NgModule({
	imports: [
		RouterModule.forRoot([
			{
				path: '', component: BaseComponent,
				children: [
					// admin routes
					{
						path: 'compose', loadChildren: () => import('app/modules/compose-module/compose.module').then(m => m.ComposeModule),
						canActivate: [AdminGuard], canLoad: [AdminGuard]
					},
					{
						path: 'admin', loadChildren: () => import('app/modules/admin-module/admin.module').then(m => m.AdminModule),
						canActivate: [AdminGuard], canLoad: [AdminGuard]
					},
					// generic routes
					{
						path: 'login', loadChildren: () => import('app/modules/auth-module/auth.module').then(m => m.AuthModule), pathMatch: 'full',
						canActivate: [LoginGuard]
					},
					{ path: 'search', loadChildren: () => import('app/modules/search-module/search.module').then(m => m.SearchModule) },
					// User routes (all users)
					{
						path: 'user', loadChildren: () => import('app/modules/user-module/user.module').then(m => m.UserModule), pathMatch: 'full',
						canActivate: [AuthGuard], canLoad: [AuthGuard]
					},
					// CMS routes
					{ path: '', pathMatch: 'full', children: [], canActivate: [RedirectGuard] },
					{ path: ':content', component: ContentComponent },
					{ path: '**', children: [], canActivate: [RedirectGuard] }
				]
			},
		])
	],
	exports: [
		RouterModule
	]
})
export class BaseRoutingModule { }
