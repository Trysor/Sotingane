import { Pipe, PipeTransform } from '@angular/core';
import { formatDistance } from 'date-fns';

@Pipe({ name: 'TimeAgo', pure: false }) // new Date() makes it unpure
export class TimeAgoPipe implements PipeTransform {

	transform(date: string | number | Date): string {
		if (!date) { throw new Error('timeAgo Pipe: Missing arg'); }
		return formatDistance(date, new Date(), { addSuffix: true });
	}
}
