import { NgModule } from '@angular/core';


// Router
import { ComposeRoutingModule } from './compose.routing-module';

// Modules
import { ContentModule } from '@app/modules/content-module/content.module';
import { SharedModule } from '@app/modules/shared-module/shared.module';
import { CommonModule } from '@app/modules/common.module';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { MatDialogModule } from '@angular/material/dialog';


// Components
import { ComposeComponent } from './compose-component/compose.component';
import { CKEDitorComponent } from './ckeditor-component/ckeditor.component';
import { FilesUploadedComponent } from './filesuploaded-component/filesuploaded.component';

@NgModule({
	declarations: [
		ComposeComponent,
		CKEDitorComponent,
		FilesUploadedComponent
	],
	entryComponents: [
		FilesUploadedComponent
	],
	imports: [
		MatDialogModule,
		SharedModule,
		ContentModule,
		CommonModule,
		CKEditorModule,
		ComposeRoutingModule
	]
})
export class ComposeModule { }
