import { Component, ChangeDetectionStrategy } from '@angular/core';

import { LoadingService } from '@app/services';

@Component({
	selector: 'loadingbar-component',
	templateUrl: './loadingbar.component.html',
	styleUrls: ['./loadingbar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingbarComponent {
	constructor(public loading: LoadingService) { }
}
