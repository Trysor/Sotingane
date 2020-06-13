import { Component, ChangeDetectionStrategy, Optional } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, CanDeactivate } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { MatSelectChange } from '@angular/material/select';

import { FormErrorInstant, AccessHandler, DestroyableClass } from '@app/classes';
import { CMSService } from '@app/services/controllers/cms.service';
import { AdminService } from '@app/services/controllers/admin.service';
import { ModalService } from '@app/services/utility/modal.service';
import { StorageService, StorageKey } from '@app/services/utility/storage.service';

import { HistoryHandler } from './compose.history.handler';

import { Content, AccessRoles } from '@types';
import { CONTENT_MAX_LENGTH } from '@global';


import { BehaviorSubject, of, pipe, Observable } from 'rxjs';
import { takeUntil, catchError, distinctUntilChanged, finalize, map, startWith } from 'rxjs/operators';


@Component({
	selector: 'compose-component',
	templateUrl: './compose.component.html',
	styleUrls: ['./compose.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComposeComponent extends DestroyableClass implements CanDeactivate<ComposeComponent> {

	// Public readonly fields required for HTML
	public readonly AccessRoles = AccessRoles;
	public readonly accessHandler = new AccessHandler();
	public readonly HistoryHandler: HistoryHandler;
	public readonly CONTENT_MAX_LENGTH = CONTENT_MAX_LENGTH;
	public readonly formErrorInstant = new FormErrorInstant(); // Form validation errors trigger instantly
	public readonly ContentForm: FormGroup; // Form

	// Public properties used by HTML
	public get OriginalRoute() { return this._originalContent && this._originalContent.route; }
	public get FilteredFolderList() { return this._filteredFolders; }

	public get tabIndex() { return this.storage.getSession(StorageKey.ComposeTabIndex); }
	public set tabIndex(value: string) { this.storage.setSession(StorageKey.ComposeTabIndex, value); }

	private _editor: any;
	public get Editor() { return this._editor; }
	public set Editor(editor: any) { this._editor = editor; }

	// FOLDER FIELDS
	private _folders: string[] = []; // Holds a list of used Folders
	private readonly _filteredFolders = new BehaviorSubject<string[]>(['']);

	// TAGS FIELDS
	private readonly _tags = new BehaviorSubject<string[]>([]);
	public get Tags() { return this._tags; }


	// DRAFTING FIELDS
	private _originalContent: Content; // When editing, the original content is kept here


	// ---------------------------------------
	// ------------- CONSTRUCTOR -------------
	// ---------------------------------------

	constructor(
		@Optional() private modalService: ModalService,
		private storage: StorageService,
		private datePipe: DatePipe,
		private router: Router,
		private route: ActivatedRoute,
		private fb: FormBuilder,
		public cmsService: CMSService,
		private adminService: AdminService) {

		super();
		this.HistoryHandler = new HistoryHandler(this.datePipe);

		// Form
		this.ContentForm = this.initForm();

		// Set current draft as blank initially. May be overriden until loaded.
		this.HistoryHandler.setWorkingDraft(this.ContentForm.getRawValue());

		this.initFormHooks();

		this.loadTags();

		// Router: Check if we are editing or creating content. Load from API
		const editingContentRoute = this.route.snapshot.params.route;
		if (editingContentRoute) {
			this.loadEditContentForRoute(editingContentRoute);
		}

	}


	// ---------------------------------------
	// ------------ INITALIZATION ------------
	// ---------------------------------------

	private initForm() {
		return this.fb.group({
			route: ['', Validators.compose([
				Validators.maxLength(this.CONTENT_MAX_LENGTH.ROUTE),
				this.propertyMustBeUnique(this.cmsService.getContentList(), 'route').bind(this)
			])],
			title: ['', Validators.compose([
				Validators.maxLength(this.CONTENT_MAX_LENGTH.TITLE),
				this.propertyMustBeUnique(this.cmsService.getContentList(), 'title').bind(this)
			])],
			published: [true],
			description: ['', Validators.compose([
				Validators.required,
				Validators.maxLength(this.CONTENT_MAX_LENGTH.DESC)
			])],
			access: [[]],
			nav: [true],
			folder: ['', Validators.maxLength(this.CONTENT_MAX_LENGTH.FOLDER)],
			content: ['', Validators.required],
			tags: [[]]
		});
	}


	private initFormHooks() {
		const pipes = <T>() => pipe<Observable<T>, Observable<T>, Observable<T>>(distinctUntilChanged(), takeUntil(this.OnDestroy));

		// Create Folder autocomplete list
		this.cmsService.getContentList().pipe(pipes()).subscribe(contentList => this.setFoldersFromList(contentList));


		// Hook onto folder changes such that we can filter our list
		this.ContentForm.get('folder').valueChanges.pipe<string>(pipes()).subscribe(val => this._filteredFolders.next(
			this._folders.filter(option => option.toLowerCase().includes(val.toLowerCase()))
		));

		// Hook to disable / enable form and control states based on nav toggle
		this.ContentForm.get('nav').valueChanges.pipe<boolean>(pipes()).subscribe((e) => {
			this.setFormDisabledState();
		});

		// Hook to Update routeEdit IFF the user specifically edits title without having touched route, and the values are equal
		const routeEdit = this.ContentForm.get('route');
		const titleEdit = this.ContentForm.get('title');
		let oldTitleValue = titleEdit.value;
		titleEdit.valueChanges.pipe<string>(pipes()).subscribe(newVal => {
			if (titleEdit.dirty && !routeEdit.dirty && !routeEdit.disabled && (oldTitleValue === routeEdit.value)) {
				routeEdit.setValue(newVal);
			}
			oldTitleValue = newVal;
		});
	}


	private loadEditContentForRoute(route: string) {
		// Lock down form whilst loading.
		this.ContentForm.disable();

		// Fetch content that we're supposed to be editing
		this.adminService.getContentPage(route).pipe(
			catchError(() => {
				this.router.navigateByUrl('/compose'); // Could not find any data. Navigate to create
				return of(null as Content);
			}),
			finalize(() => {
				this.setFormDisabledState(); // Unlock the controls that should be available
				this.ContentForm.markAsPristine(); // Should not be touched at this point
			})
		).subscribe(data => {
			if (!data) { return; }

			// Set the initial state
			this._originalContent = data;
			this.HistoryHandler.setWorkingDraft(data);

			// Update the form
			this.ContentForm.patchValue(data);
		});

		// We also need to fetch history when editing existing content
		this.cmsService.requestContentHistory(route).subscribe(list => { this.HistoryHandler.setHistoryList(list); });
	}


	private loadTags() {
		// Fetch all tags
		this.cmsService.requestAllTags().pipe(startWith([])).subscribe(requestedTags => this._tags.next(requestedTags));
	}


	// ---------------------------------------
	// ------------- INTERFACES --------------
	// ---------------------------------------


	// Implements interface: CanDeactivate<ComposeComponent>
	canDeactivate() {
		// if (!this.authService.user.getValue()) { return true; }
		if (!this.ContentForm.dirty) {
			return true;
		} // We can deactivate so long we're not dirty
		return this.modalService.openDeactivateComposeModal().afterClosed();
	}



	// ---------------------------------------
	// ----------- EVENT HANDLERS ------------
	// ---------------------------------------

	/**
	 * Event handler for when the user selects a history item
	 */
	public onSetStateAsHistroyFromVersion(event: MatSelectChange) {
		// Only store current draft when the user is actually able to draft.
		// The form should be disabled when reviewing history.
		const c = this.HistoryHandler.reconfigureAfterVersionChange(
			this.ContentForm.disabled
				? null
				: this.ContentForm.value
		);

		this.ContentForm.patchValue(c);
		this.setFormDisabledState();
	}

	/**
	 * Presents the user with a modal asking if the he/she wants to restore a previous
	 * version of the content, and if accepted the state is then set to drafting with
	 * the restored history content as the draft content.
	 */
	public onSetSateFromHistoryAsCurrentDraft() {
		if (this.HistoryHandler.isDrafting) { return; }
		const historyItemToBeApplied = this.HistoryHandler.HistoryValue;

		this.modalService.openRestoreOldVersionModal(
			this.HistoryHandler.getHistoryItemFormatted(this.HistoryHandler.HistoryVersionIndex),
		).afterClosed().subscribe(result => {
			if (!result) { return; }

			this.HistoryHandler.HistoryVersionIndex = this.HistoryHandler.VersionHistory.Draft;
			this.HistoryHandler.reconfigureAfterVersionChange(historyItemToBeApplied);

			this.ContentForm.markAsDirty(); // restoring should mark it as dirty
			this.setFormDisabledState();
		});
	}


	/**
	 * Submits the form and hands it over to the cmsService
	 */
	public submitForm() {
		const content: Content = this.ContentForm.getRawValue();
		content.route = content.route.toLowerCase();

		if (this.OriginalRoute) {
			// use OriginalRoute instead of the new route, as we want to update
			// the route might've changed in the form data
			this.cmsService.updateContent(this.OriginalRoute, content)
				.pipe(catchError((e: HttpErrorResponse) => of(e)))
				.subscribe(newContent => { this.onSubmit(newContent); });
			return;
		}

		this.cmsService.createContent(content)
			.pipe(catchError((e: HttpErrorResponse) => of(e)))
			.subscribe(newContent => { this.onSubmit(newContent); });
	}

	// ---------------------------------------
	// -------------- ON SUBMIT --------------
	// ---------------------------------------

	private onSubmit(returnValue: Content | HttpErrorResponse) {
		if (returnValue instanceof HttpErrorResponse) {
			// TODO: open login modal if 401 and user object doesn't exist. Then if login passed run submitForm() again
			this.modalService.openHTTPErrorModal(returnValue.error);
			return Promise.resolve(false);
		}

		if (!!returnValue) {
			this.cmsService.getContentList(true);
			this.ContentForm.markAsPristine(); // Mark the content form as pristince to allow navigation

			return this.router.navigateByUrl(returnValue.published ? returnValue.route : '');
		}
	}


	// ---------------------------------------
	// ------------ FORM HELPERS -------------
	// ---------------------------------------

	/**
	 * Form Validation that disallows values that are considered unique for the given property.
	 */
	private propertyMustBeUnique(contentList: BehaviorSubject<Content[]>, prop: keyof Content) {
		return (control: FormControl): { [key: string]: any } => {
			const list = contentList.getValue();
			if (list && list.some(content => this.validateDoesValueAlreadyExist(control.value, content, prop))) {
				return { alreadyExists: true };
			}
		};
	}


	private validateDoesValueAlreadyExist(value: string, content: Content, prop: keyof Content) {
		const val = (content[prop] as string).toLowerCase();
		const valueToCheck = value.toLowerCase();

		if (this._originalContent) {
			// Only match for equal values that are NOT the same as the originalContent value (which is this draft)
			const originalVal = (this._originalContent[prop] as string).toLowerCase();
			return (valueToCheck === val) && (val !== originalVal);
		}
		return (valueToCheck === val);
	}

	/**
	 * toggles the disabled status of the folder field.
	 */
	private setFormDisabledState() {
		// Disable form for old versions
		if (!this.HistoryHandler.isDrafting) {
			this.ContentForm.disable();
			return;
		}
		// Enable form for draft
		this.ContentForm.enable();

		if (this.ContentForm.get('nav').value) {
			this.ContentForm.get('folder').enable();
		} else {
			this.ContentForm.get('folder').disable();
		}
	}


	// ---------------------------------------
	// ----------- FOLDER HELPERS ------------
	// ---------------------------------------

	/**
	 * Create folders based on the list of content we've got available
	 */
	public setFoldersFromList(contentList: Content[]) {
		if (!contentList) { return; }

		const folders: string[] = [];

		for (const content of contentList) {
			if (content.folder && folders.indexOf(content.folder) === -1) {
				folders.push(content.folder);
			}
		}
		this._folders = folders.sort();
		this._filteredFolders.next(
			this._folders.filter(option => option.toLowerCase().includes(this.ContentForm.get('folder').value.toLowerCase()))
		);
	}
}
