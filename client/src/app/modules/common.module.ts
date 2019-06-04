import { NgModule } from '@angular/core';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';


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
