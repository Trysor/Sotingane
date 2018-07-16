import { NgModule } from '@angular/core';

import {
	MatListModule,
	MatIconModule,
	MatProgressBarModule,
	MatSidenavModule,
	MatPaginatorModule,
	MatInputModule,
	MatButtonModule,
	MatTableModule,
	MatSortModule,
	MatSnackBarModule,
	MatTooltipModule,
	MatMenuModule,
	MatDialogModule
} from '@angular/material';


@NgModule({
	exports: [
		MatListModule,
		MatIconModule,
		MatProgressBarModule,
		MatSidenavModule,
		MatPaginatorModule,
		MatInputModule,
		MatButtonModule,
		MatTableModule,
		MatSortModule,
		MatSnackBarModule,
		MatTooltipModule,
		MatMenuModule,
		MatDialogModule
	]
})
export class MaterialModule { }
