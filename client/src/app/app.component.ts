import { Component, ViewEncapsulation } from '@angular/core';

import { SetupService } from '@app/services/utility/setup.service';

@Component({
	selector: 'app-root',
	template: `<router-outlet></router-outlet>`,
	encapsulation: ViewEncapsulation.None
})
export class AppComponent {

	constructor(public setupService: SetupService) { }
}
