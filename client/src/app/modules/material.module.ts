import { NgModule } from '@angular/core';

// Importing from '@angular/material' is depricated / removed in angular 9.0
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';


@NgModule({
	exports: [
		MatIconModule,
		MatProgressSpinnerModule,
		MatProgressBarModule,
		MatSidenavModule,
		MatButtonModule,
		MatSnackBarModule,
		MatTooltipModule,
		MatMenuModule,
		MatDialogModule,
		MatInputModule,
		MatDividerModule
	]
})
export class MaterialModule { }
