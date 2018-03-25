import { NgModule } from '@angular/core';

// Modules
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
