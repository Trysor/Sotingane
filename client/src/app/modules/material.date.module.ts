import { NgModule } from '@angular/core';

import { MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatNativeDateModule } from '@angular/material/core';

import { DateAdapterService } from '@app/services/utility/dateadapter.service';

@NgModule({
	exports: [
		MatNativeDateModule
	],
	providers: [
		{ provide: DateAdapter, useClass: DateAdapterService },
		{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
	],
})
export class MaterialDateModule { }
