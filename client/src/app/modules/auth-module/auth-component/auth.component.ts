import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'auth-component',
	templateUrl: './auth.component.html',
	styleUrls: ['./auth.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent {
	constructor() { }

}
