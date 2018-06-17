import { Component, ChangeDetectionStrategy } from '@angular/core';

import { env } from '@env';


@Component({
	selector: 'footer-component',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {

	public desc = env.FOOTER.desc;
	public copyright = env.FOOTER.copyright;

	constructor() { }
}
