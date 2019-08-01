import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

// Modules
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';

// Pipes
import { TimeAgoPipe, NumberPipe } from '@app/pipes';
import { DatePipe } from '@angular/common';

// Directives
import { MobileDirective } from '@app/directives/mobile.directive';

// Components
import { ModalComponent } from './modals/modal.component';
import { ImageModalComponent } from './modals/imagemodal.component';
import { SectionWrapperComponent } from './sectionwrapper-component/sectionwrapper.component';
import { SectionComponent } from './section-component/section.component';
import { TableComponent } from './table-component/table.component';

@NgModule({
	imports: [
		CommonModule,
		MaterialModule,
		ReactiveFormsModule,
		RouterModule
	],
	exports: [
		CommonModule,
		MaterialModule,
		ReactiveFormsModule,
		RouterModule,
		HttpClientModule,
		TimeAgoPipe,
		NumberPipe,
		SectionWrapperComponent,
		SectionComponent,
		TableComponent,
		MobileDirective
	],
	declarations: [
		TimeAgoPipe,
		NumberPipe,
		ModalComponent,
		ImageModalComponent,
		SectionWrapperComponent,
		SectionComponent,
		TableComponent,
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
