import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MobileService } from '@app/services/utility/mobile.service';

@Component({
	selector: 'auth-component',
	templateUrl: './auth.component.html',
	styleUrls: ['./auth.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent {
	constructor(public mobileService: MobileService) { }

}
