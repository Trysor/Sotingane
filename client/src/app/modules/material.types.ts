
// Importing from '@angular/material' is depricated / removed in angular 9.0

// CORE
import { MAT_DATE_LOCALE, DateAdapter, NativeDateAdapter, ErrorStateMatcher } from '@angular/material/core';

// DIALOG
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';

// ICON
import { MatIconRegistry } from '@angular/material/icon';

// PAGINATOR
import { MatPaginator } from '@angular/material/paginator';

// SELECT
import { MatSelectChange } from '@angular/material/select';

// SIDENAV
import { MatDrawer } from '@angular/material/sidenav';

// SNACKBAR
import { MatSnackBar } from '@angular/material/snack-bar';

// SORT
import { MatSort } from '@angular/material/sort';

// TABLE
import { MatTable, MatTableDataSource } from '@angular/material/table';


export {
	// CORE: Dates
	MAT_DATE_LOCALE, DateAdapter, NativeDateAdapter,

	// CORE: Error
	ErrorStateMatcher,

	// DIALOG
	MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig,

	// ICON
	MatIconRegistry,

	// PAGINATOR
	MatPaginator,

	// SELECT
	MatSelectChange,

	// SIDENAV
	MatDrawer,

	// SNACKBAR
	MatSnackBar,

	// SORT
	MatSort,

	// TABLE
	MatTable, MatTableDataSource
};

