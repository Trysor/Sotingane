import { Component, ViewChild, Input, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';

import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { FormBuilder, FormGroup } from '@angular/forms';

import { ColumnSettings, ColumnType, TableSettings, TableFilterSettings, Column } from '@types';
import { MobileService } from '@app/services/utility/mobile.service';

import { takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { DestroyableClass } from '@app/classes';

@Component({
	selector: 'table-component',
	templateUrl: './table.component.html',
	styleUrls: ['./table.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent<T extends object> extends DestroyableClass implements OnInit, AfterViewInit {
	@ViewChild(MatTable, { static: false }) table: MatTable<T>;
	@ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
	@ViewChild(MatSort, { static: false }) sort: MatSort;
	@Input() settings: TableSettings<T>;
	@Input() filterSettings: TableFilterSettings = {}; // default empty object
	@Input() set data(value: T[]) { this.Source.data = value || []; }

	// HTML helpers
	public readonly ColumnType = ColumnType;
	public readonly isNaN = isNaN;

	public readonly pageSizes = [10, 25, 50, 100];
	public readonly defaultPageSize = 25;
	public readonly Source = new MatTableDataSource<object>([]);
	public displayedColumns: Column<T>[];

	public readonly filterForm: FormGroup;

	private filterRegex: RegExp;

	constructor(
		private fb: FormBuilder,
		public mobileService: MobileService) {
		super();
		// Set initial data to avoid html errors
		this.Source.data = [];

		// Filter form
		this.filterForm = this.fb.group({ filterControl: [''] });
		this.filterForm.get('filterControl').valueChanges.pipe(
			distinctUntilChanged(), debounceTime(300), takeUntil(this.OnDestroy)
		).subscribe(value => {
			if (this.filterSettings.func) {
				this.filterSettings.func(value);
				return;
			}
			this.filterRegex = new RegExp(this.escapeFilter(value), 'i');
			this.Source.filter = value.trim().toLowerCase();
		});


		// Filter based on what the user sees rather than the data property values
		this.Source.filterPredicate = (data: T) => {
			for (const col of this.settings.columns) {
				if (!(col.property in data)) { continue; } // only match against columns that are properties

				const val = col.val ? col.val(data, this.Source.data as T[]) : data[col.property as keyof T];
				if (this.filterRegex.test(val.toString())) { return true; }
			}
			return false;
		};

		this.OnDestroy.subscribe(() => {
			this.data = null;
			this.Source.disconnect();
		});
	}


	ngOnInit() {
		if (!this.settings) { throw Error('No settings'); }

		this.mobileService.isMobile().pipe(distinctUntilChanged()).subscribe(isMobile => {
			this.displayedColumns = isMobile ? this.settings.mobile : this.settings.columns.map(col => col.property);
		});
	}

	ngAfterViewInit() {
		// These must be placed here; the view must've been initialized.
		this.table.trackBy = this.settings.trackBy;
		this.Source.paginator = this.paginator;
		this.Source.sort = this.sort;
	}

	/**
	 * method to perform the click function on a row
	 */
	public rowClick(row: T) {
		if (!this.settings.rowClick) { return; }
		this.settings.rowClick(row);
	}

	/**
	 * Handler for column func button clicks
	 */
	public buttonClick(col: ColumnSettings<T>, obj: T, e: MouseEvent) {
		col.func(obj, this.Source.data as T[]);
		this.overrideClick(e);
	}

	/**
	 * Click override for hyperlinks and buttons - disable propagation so that row clicks do not trigger
	 */
	public overrideClick(e: MouseEvent) {
		e.stopPropagation();
	}


	private escapeFilter(filterString: string) {
		return filterString.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
	}
}


