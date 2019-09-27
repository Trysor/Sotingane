import { NgModule } from '@angular/core';

import { SharedModule } from '../shared-module/shared.module';


import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { ScrollingModule } from '@angular/cdk/scrolling';


import { TableComponent } from './table-component/table.component';
import { SectionWrapperComponent } from './sectionwrapper-component/sectionwrapper.component';
import { SectionComponent } from './section-component/section.component';


@NgModule({
	exports: [
		// Material
		MatAutocompleteModule,
		MatSelectModule,
		MatCheckboxModule,
		MatExpansionModule,
		MatPaginatorModule,
		MatTabsModule,
		MatTableModule,
		MatSortModule,
		MatDatepickerModule,
		ScrollingModule,

		// Components
		TableComponent,
		SectionWrapperComponent,
		SectionComponent
	],
	declarations: [
		TableComponent,
		SectionWrapperComponent,
		SectionComponent
	],
	imports: [
		SharedModule,

		// Material
		MatAutocompleteModule,
		MatSelectModule,
		MatCheckboxModule,
		MatExpansionModule,
		MatPaginatorModule,
		MatTabsModule,
		MatTableModule,
		MatSortModule,
		MatDatepickerModule,
		ScrollingModule,
	]
})
export class CommonModule { }
