import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material';

import { format } from 'date-fns';

@Injectable()
export class DateAdapterService extends NativeDateAdapter {
	format(date: Date, displayFormat: Object): string {
		if (displayFormat === 'input') {
			return format(date, 'YYYY-MM-dd');
		}
		return format(date, 'YYYY-MM-dd');
	}
}
