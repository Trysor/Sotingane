import { NgModule } from '@angular/core';

import {
	MatAutocompleteModule,
	MatSelectModule,
	MatCheckboxModule,
	MatExpansionModule,
	MatProgressSpinnerModule,
	MatTabsModule,
	MatDatepickerModule
} from '@angular/material';

@NgModule({
	exports: [
		MatAutocompleteModule,
		MatSelectModule,
		MatCheckboxModule,
		MatExpansionModule,
		MatProgressSpinnerModule,
		MatTabsModule,
		MatDatepickerModule
	]
})
export class CommonModule { }
