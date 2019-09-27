import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Modules
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../material.module';

// Pipes
import { TimeAgoPipe, NumberPipe } from '@app/pipes';
import { DatePipe } from '@angular/common';

// Directives
import { MobileDirective } from '@app/directives/mobile.directive';

// Components
import { ModalComponent } from './modals/modal.component';
import { ImageModalComponent } from './modals/imagemodal.component';


@NgModule({
	imports: [
		CommonModule,
		MaterialModule,
		RouterModule
	],
	exports: [
		CommonModule,
		ReactiveFormsModule,
		MaterialModule,
		RouterModule,
		HttpClientModule,
		TimeAgoPipe,
		NumberPipe,
		MobileDirective,
	],
	declarations: [
		TimeAgoPipe,
		NumberPipe,
		ModalComponent,
		ImageModalComponent,
		MobileDirective
	],
	providers: [
		DatePipe
	],
	entryComponents: [
		ModalComponent,
		ImageModalComponent
	]
})
export class SharedModule {}
