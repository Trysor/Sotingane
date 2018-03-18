import { NgModule } from '@angular/core';


// Router
import { ComposeRoutingModule } from './compose.routing-module';

// Modules
import { ContentModule } from '@app/modules/content-module/content.module';
import { SharedModule } from '@app/modules/shared-module/shared.module';
import { CommonModule } from '@app/modules/common.module';

// Components
import { ComposeComponent } from './compose-component/compose.component';
import { CKEditorComponent } from './ckeditor-component/ckeditor.component';



@NgModule({
	declarations: [
		ComposeComponent,
		CKEditorComponent,
	],
	imports: [
		SharedModule,
		ContentModule,
		CommonModule,
		ComposeRoutingModule
	]
})
export class ComposeModule { }
