import { Component, ChangeDetectionStrategy } from '@angular/core';

import { SettingsService } from '@app/services/controllers/settings.service';

@Component({
	selector: 'footer-component',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
	constructor(public settingsService: SettingsService) { }
}
