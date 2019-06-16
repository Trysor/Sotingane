import { NgModule } from '@angular/core';

// Importing from '@angular/material' is depricated / removed in angular 9.0
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';



@NgModule({
	exports: [
		MatListModule,
		MatIconModule,
		MatProgressSpinnerModule,
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
