import { NgModule } from '@angular/core';

import {
	MatAutocompleteModule,
	MatSelectModule,
	MatCheckboxModule,
	MatExpansionModule,
	MatTabsModule,
	MatDatepickerModule
} from '@angular/material';

@NgModule({
	exports: [
		MatAutocompleteModule,
		MatSelectModule,
		MatCheckboxModule,
		MatExpansionModule,
		MatTabsModule,
		MatDatepickerModule
	]
})
export class CommonModule { }
