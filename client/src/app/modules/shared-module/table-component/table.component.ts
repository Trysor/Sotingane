import { Component, ViewChild, Input, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';

import { MatTable, MatTableDataSource, MatSort, MatPaginator } from '@app/modules/material.types';

import { FormBuilder, FormGroup } from '@angular/forms';

import { ColumnSettings, ColumnType, TableSettings, TableFilterSettings, Column } from '@types';
import { MobileService } from '@app/services';

import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';

@Component({
	selector: 'table-component',
	templateUrl: './table.component.html',
	styleUrls: ['./table.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnInit, AfterViewInit {
	@ViewChild(MatTable, { static: false }) table: MatTable<object>;
	@ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
	@ViewChild(MatSort, { static: false }) sort: MatSort;
	@Input() settings: TableSettings<any>;
	@Input() filterSettings: TableFilterSettings = {}; // default empty object
	@Input() set data(value: object[]) { this.Source.data = value || []; }

	public readonly ColumnType = ColumnType;
	public readonly isNaN = isNaN;

	public readonly pageSizes = [10, 25, 50, 100];
	public readonly Source = new MatTableDataSource<object>([]);
	public displayedColumns: Column<any>[];

	private readonly _ngUnsub = new Subject();
	public readonly filterForm: FormGroup;

	private filterRegex: RegExp;

	constructor(
		private fb: FormBuilder,
		public mobileService: MobileService) {
		// Set initial data to avoid html errors
		this.Source.data = [];

		// Filter form
		this.filterForm = fb.group({ filterControl: [''] });
		this.filterForm.get('filterControl').valueChanges.pipe(
			distinctUntilChanged(), debounceTime(300), takeUntil(this._ngUnsub)
		).subscribe(value => {
			if (this.filterSettings.func) {
				this.filterSettings.func(value);
				return;
			}
			this.filterRegex = new RegExp(value, 'i');
			this.Source.filter = value.trim().toLowerCase();
		});


		// Filter based on what the user sees rather than the data property values
		this.Source.filterPredicate = (data: object, filter: string) => {
			for (const col of this.settings.columns) {
				if (!(col.property in data)) { continue; } // only match against columns that are properties

				const val = col.val ? col.val(data, this.Source.data) : data[col.property];
				if (this.filterRegex.test(val)) { return true; }
			}
			return false;
		};
	}


	ngOnInit() {
		if (!this.settings) { throw Error('No settings'); }

		this.mobileService.isMobile().subscribe(isMobile => {
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
	public rowClick(row: object) {
		if (this.settings.rowClick) {
			this.settings.rowClick(row);
		}
	}

	/**
	 * Handler for column func button clicks
	 */
	public buttonClick(col: ColumnSettings<any>, obj: object, e: MouseEvent) {
		col.func(obj, this.Source.data);
		this.overrideClick(e);
	}

	/**
	 * Click override for hyperlinks and buttons - disable propagation so that row clicks do not trigger
	 */
	public overrideClick(e: MouseEvent) {
		e.stopPropagation();
	}

}


