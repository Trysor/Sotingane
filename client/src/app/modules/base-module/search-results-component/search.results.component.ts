import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { DatePipe } from '@angular/common';

import { MobileService } from '@app/services';
import { CmsContent, TableSettings, ColumnType, ColumnDir, TableFilterSettings } from '@app/models';

import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'search-results-component',
	templateUrl: './search.results.component.html',
	styleUrls: ['./search.results.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultsComponent implements OnDestroy {
	private _ngUnsub = new Subject();

	public data = new BehaviorSubject<CmsContent[]>([]);

	public readonly settings: TableSettings = {
		columns: [
			{
				header: 'Title',
				property: 'title',
			},
			{
				header: 'Relevance',
				property: 'relevance',
				rightAlign: true,
				displayFormat: (c: CmsContent) => `${(100 * c.relevance).toFixed(2)}%`,
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
				displayFormat: (c: CmsContent): string => {
					return this.datePipe.transform(c.updatedAt);
				}
			},
			{
				header: ' ',
				property: 'image',
				narrow: true,
				noSort: true,
				type: ColumnType.Image
			},

		],
		mobile: ['title', 'relevance'],

		active: 'relevance',
		dir: ColumnDir.DESC,

		trackBy: (index: number, c: CmsContent) => c.title,
		rowClick: (c: CmsContent) => this.router.navigateByUrl('/' + c.route)
	};

	public readonly filterSettings: TableFilterSettings = {
		placeholder: 'Search',
		hidden: this.mobileService.isMobile(),
		func: (term: string) => { this.setResults(term); }
	};


	constructor(
		private router: Router,
		private datePipe: DatePipe,
		public route: ActivatedRoute,
		public mobileService: MobileService) {

		this.router.events.pipe(takeUntil(this._ngUnsub)).subscribe(e => {
			if (e instanceof NavigationEnd) { this.setResults(); }
		});
	}

	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}

	/**
	 * Set searchResults helper
	 */
	private setResults(term?: string) {
		if (term) {
			this.router.navigateByUrl('/search/' + term);
			return;
		}
		this.data.next(this.route.snapshot.data['SearchResults']);
	}

}
