import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'section-component',
	templateUrl: './section.component.html',
	styleUrls: ['./section.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionComponent {
	@Input() public header: '';

	constructor() { }
}
