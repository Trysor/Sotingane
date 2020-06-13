import { NgModule } from '@angular/core';

// Router
import { RouterModule } from '@angular/router';

// Modules
import { SharedModule } from '@app/modules/shared-module/shared.module';
import { CommonModule } from '@app/modules//common-module/common.module';

// Components
import { SearchResultsComponent } from './search-results-component/search.results.component';


@NgModule({
	declarations: [
		SearchResultsComponent,
	],
	imports: [
		RouterModule.forChild([
			{ path: ':term', component: SearchResultsComponent },
			{ path: '', component: SearchResultsComponent, pathMatch: 'full', data: { SearchResults: '' } },
		]),
		SharedModule,
		CommonModule
	]
})
export class SearchModule { }
