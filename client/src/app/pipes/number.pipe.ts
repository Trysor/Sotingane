import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'number', pure: true })
export class NumberPipe implements PipeTransform {
	transform(num: number): string {
		if (typeof num !== 'number') {
			if (typeof num === 'string' && num === '') { return num; }

			const tryCastNum = Number(num);
			return Number.isNaN(tryCastNum) ? num : tryCastNum.toLocaleString();
		}
		return num.toLocaleString();
	}
}
