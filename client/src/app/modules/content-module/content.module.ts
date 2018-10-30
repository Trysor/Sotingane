import { NgModule } from '@angular/core';

// Modules
import { SharedModule } from '@app/modules/shared-module/shared.module';

// Components
import { ContentComponent } from './content-component/content.component';
import { DynamicLinkComponent } from './content-controllers/dynamic.link.component';
import { DynamicMediaComponent } from './content-controllers/dynamic.media.component';
import { DynamicImageComponent } from './content-controllers/dynamic.image.component';

@NgModule({
	declarations: [
		ContentComponent,
		DynamicLinkComponent,
		DynamicMediaComponent,
		DynamicImageComponent
	],
	imports: [
		SharedModule
	],
	entryComponents: [
		DynamicLinkComponent,
		DynamicMediaComponent,
		DynamicImageComponent
	],
	exports: [
		ContentComponent
	]
})
export class ContentModule { }
