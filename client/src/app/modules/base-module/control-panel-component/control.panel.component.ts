import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '@app/services/controllers/auth.service';

@Component({
	selector: 'control-panel-component',
	templateUrl: './control.panel.component.html',
	styleUrls: ['./control.panel.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlPanelComponent {
	@Input() layout: 'menu';
	constructor(
		public authService: AuthService) { }
}
