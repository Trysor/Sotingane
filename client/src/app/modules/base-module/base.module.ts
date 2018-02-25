import { NgModule } from '@angular/core';

// Router
import { BaseRoutingModule } from './base.routing-module';

// Modules
import { SharedModule } from '@app/modules/shared-module/shared.module';
import { ContentModule } from '@app/modules/content-module/content.module';

// Components
import { BaseComponent } from './base-component/base.component';
import { HeaderComponent } from './header-component/header.component';
import { LoadingbarComponent } from './loadingbar-component/loadingbar.component';
import { ControlPanelComponent } from './control-panel-component/control.panel.component';
import { FooterComponent } from './footer-component/footer.component';
import { NavComponent } from './nav-component/nav.component';
import { SearchComponent } from './search-component/search.component';
import { SearchResultsComponent } from './search-results-component/search.results.component';


// Resolvers
import { CmsResolver, SearchResolver } from '@app/guards';


@NgModule({
	declarations: [
		BaseComponent,
		HeaderComponent,
		LoadingbarComponent,
		ControlPanelComponent,
		FooterComponent,
		NavComponent,
		SearchComponent,
		SearchResultsComponent
	],
	imports: [
		SharedModule.forRoot(),
		ContentModule,
		BaseRoutingModule
	],
	providers: [
		CmsResolver, SearchResolver
	]
})
export class BaseModule { }
