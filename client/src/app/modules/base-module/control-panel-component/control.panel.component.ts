import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '@app/services/controllers/auth.service';
import { AccessRoles } from '@types';

@Component({
	selector: 'control-panel-component',
	templateUrl: './control.panel.component.html',
	styleUrls: ['./control.panel.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlPanelComponent {
	public readonly AccessRoles = AccessRoles;

	@Input() layout: 'menu';
	constructor(
		public authService: AuthService) { }
}
