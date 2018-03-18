import { NgModule } from '@angular/core';

// Modules
import { SharedModule } from '@app/modules/shared-module/shared.module';

// Components
import { ContentComponent } from './content-component/content.component';
import { DynamicLinkComponent } from './content-controllers/dynamic.link.component';
import { DynamicImageComponent } from './content-controllers/dynamic.image.component';

@NgModule({
	declarations: [
		ContentComponent,
		DynamicLinkComponent,
		DynamicImageComponent
	],
	imports: [
		SharedModule
	],
	entryComponents: [
		DynamicLinkComponent,
		DynamicImageComponent
	],
	exports: [
		ContentComponent
	]
})
export class ContentModule { }
