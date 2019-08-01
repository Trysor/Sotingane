import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

import { CMSService, MobileService } from '@app/services';
import { SearchResultContent, TableSettings, ColumnType, TableFilterSettings } from '@types';

import { BehaviorSubject, of } from 'rxjs';
import { takeUntil, take, catchError } from 'rxjs/operators';
import { DestroyableClass } from '@app/classes';

@Component({
	selector: 'search-results-component',
	templateUrl: './search.results.component.html',
	styleUrls: ['./search.results.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultsComponent extends DestroyableClass {
	public data = new BehaviorSubject<SearchResultContent[]>([]);

	public readonly settings: TableSettings<SearchResultContent> = {
		columns: [
			{
				header: ' ',
				property: 'images',
				narrow: true,
				noSort: true,
				type: ColumnType.Image,
				val: c => (c.images && c.images.length > 0) ? c.images[0].url : null,
				val2: c => (c.images && c.images.length > 0) ? c.images[0].url : null,
			},
			{
				header: 'Title',
				property: 'title',
			},
			{
				header: 'Relevance',
				property: 'relevance',
				rightAlign: true,
				val: c => `${(100 * c.relevance).toFixed(2)}%`,
			},
			{
				header: 'Description',
				property: 'description',
			},
			{
				header: 'Views',
				property: 'views',
				rightAlign: true,
			},
			{
				header: 'Last updated',
				property: 'updatedAt',
				val: c => this.datePipe.transform(c.updatedAt)
			}
		],
		mobile: ['title', 'relevance'],

		active: 'relevance',
		dir: 'desc',

		trackBy: (index, c) => c.title,
		rowClick: c => this.router.navigateByUrl('/' + c.route)
	};

	public readonly filterSettings: TableFilterSettings = {
		placeholder: 'Search',
		hidden: this.mobileService.isMobile(),
		func: (term: string) => { this.router.navigateByUrl('/search/' + term); }
	};


	constructor(
		private router: Router,
		private datePipe: DatePipe,
		private cmsService: CMSService,
		public route: ActivatedRoute,
		public mobileService: MobileService) {

		super();
		this.route.paramMap.pipe(takeUntil(this.OnDestroy)).subscribe(p => {
			this.setResults(p.get('term'));
		});
	}

	/**
	 * Set searchResults helper
	 */
	private setResults(term: string) {
		this.cmsService.searchContent(term).pipe(
			take(1),
			catchError(() => of(null)),
			takeUntil(this.OnDestroy)
		).subscribe(
			list => this.data.next(!!list && Array.isArray(list) ? list : null)
		);
	}

}
