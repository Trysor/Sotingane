import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, NavigationStart } from '@angular/router';
import { DatePipe } from '@angular/common';

import { CMSService, MobileService } from '@app/services';
import { CmsContent, TableSettings, ColumnType, ColumnDir, TableFilterSettings } from '@app/models';

import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

@Component({
	selector: 'search-results-component',
	templateUrl: './search.results.component.html',
	styleUrls: ['./search.results.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultsComponent implements OnDestroy {
	private _ngUnsub = new Subject();

	public data = new BehaviorSubject<CmsContent[]>([]);

	public readonly settings: TableSettings<CmsContent> = {
		columns: [
			{
				header: ' ',
				property: 'images',
				narrow: true,
				noSort: true,
				type: ColumnType.Image,
				val: c => c.images[0],
				val2: c => c.images[0]
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
		dir: ColumnDir.DESC,

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

		this.route.paramMap.pipe(takeUntil(this._ngUnsub)).subscribe(p => {
			this.setResults(p.get('term'));
		});
	}

	ngOnDestroy() {
		this._ngUnsub.complete();
	}

	/**
	 * Set searchResults helper
	 */
	private setResults(term: string) {
		this.cmsService.searchContent(term).pipe(takeUntil(this._ngUnsub), take(1)).subscribe(
			list => this.data.next(Array.isArray(list) ? list : null),
			err => this.data.next(null)
		);
	}

}
