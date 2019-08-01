import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';


@Component({
	selector: 'search-component',
	templateUrl: './search.component.html',
	styleUrls: ['./search.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnInit {
	@Input() alternativeColor: boolean;
	public form: FormGroup;

	constructor(
		private fb: FormBuilder,
		private router: Router) {
		this.form = this.fb.group({ search: [''] });
	}

	ngOnInit() {

		let value = '';
		const url = this.router.routerState.snapshot.url;
		if (url.indexOf('/search/') === 0) {
			value = url.split('/')[2] || '';
		}

		this.form.get('search').setValue(value);
	}

	/**
	 * Perform a search and navigate to the search page
	 */
	public search() {
		this.router.navigateByUrl('/search/' + this.form.get('search').value);
		// this.form.get('search').setValue('');
	}

	/**
	 * Clears the search result
	 */
	public clear() {
		this.form.get('search').setValue('');
	}

}
