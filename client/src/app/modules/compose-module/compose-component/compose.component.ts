import { Component, OnDestroy, ChangeDetectionStrategy, Optional } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, CanDeactivate } from '@angular/router';
import { DatePipe } from '@angular/common';

import { MatSelectChange } from '@angular/material';

import { ModalService, CMSService, MobileService, AdminService, StorageService } from '@app/services';
import { CmsContent, CmsAccess, AccessRoles } from '@app/models';
import { FormErrorInstant, AccessHandler } from '@app/classes';

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';


enum VersionHistory { Draft = -1 }

@Component({
	selector: 'compose-component',
	templateUrl: './compose.component.html',
	styleUrls: ['./compose.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComposeComponent implements OnDestroy, CanDeactivate<ComposeComponent> {
	public readonly contentForm: FormGroup; // Form
	public readonly formErrorInstant = new FormErrorInstant(); // Form validation errors trigger instantly
	public originalContent: CmsContent; // When editing, the original content is kept here
	// Access
	public readonly AccessRoles = AccessRoles;
	public readonly accessHandler = new AccessHandler();

	// History fields
	public versionIndex: number = VersionHistory.Draft;
	public history: CmsContent[] = null;
	public readonly VersionHistory = VersionHistory;

	public readonly maxShortInputLength = 25;
	public readonly maxLongInputLength = 300;
	public readonly filteredFolders = new BehaviorSubject<string[]>(['']);

	private _currentDraft: CmsContent; // used with the versioning
	private folders: string[] = []; // Holds a list of used Folders

	private _ngUnsub = new Subject();
	private _hasSaved = false;

	public get tabIndex() { return this.storage.getSession('composeTabIndex'); }
	public set tabIndex(value: string) { this.storage.setSession('composeTabIndex', value); }

	constructor(
		@Optional() private modalService: ModalService,
		private storage: StorageService,
		private datePipe: DatePipe,
		private router: Router,
		private route: ActivatedRoute,
		private fb: FormBuilder,
		private cmsService: CMSService,
		private adminService: AdminService,
		public mobileService: MobileService) {

		// Form
		this.contentForm = fb.group({
			'route': ['', Validators.compose([
				Validators.maxLength(this.maxShortInputLength),
				this.disallowed(cmsService.getContentList(), 'route').bind(this)
			])],
			'title': ['', Validators.compose([
				Validators.maxLength(this.maxShortInputLength),
				this.disallowed(cmsService.getContentList(), 'title').bind(this)
			])],
			'published': [true],
			'description': ['', Validators.compose([
				Validators.required,
				Validators.maxLength(this.maxLongInputLength)
			])],
			'access': [AccessRoles.everyone, Validators.required],
			'nav': [true],
			'folder': ['', Validators.maxLength(this.maxShortInputLength)],
			'content': ['', Validators.required],
		});
		this._currentDraft = this.contentForm.getRawValue();

		// Hook (non-dirty) route to title.
		const routeEdit = this.contentForm.get('route'), titleEdit = this.contentForm.get('title');
		let oldTitleValue = titleEdit.value;
		this.contentForm.get('title').valueChanges.pipe(takeUntil(this._ngUnsub)).subscribe(newVal => {
			// Update routeEdit IFF the user specifically edits title without having touched route, and the values are equal
			if (titleEdit.dirty && !routeEdit.dirty && !routeEdit.disabled && (oldTitleValue === routeEdit.value)) {
				routeEdit.setValue(newVal);
			}
			oldTitleValue = newVal;
		});

		// Create Folder autocomplete list
		this.cmsService.getContentList().pipe(takeUntil(this._ngUnsub)).subscribe(contentList => {
			if (!contentList) { return; }
			const folders: string[] = [];
			for (const content of contentList) {
				if (content.folder && folders.indexOf(content.folder) === -1) {
					folders.push(content.folder);
				}
			}
			this.folders = folders.sort();
			this.filteredFolders.next(
				this.folders.filter(option => option.toLowerCase().includes(this.contentForm.get('folder').value.toLowerCase()))
			);
		});
		this.contentForm.get('folder').valueChanges.pipe(takeUntil(this._ngUnsub)).subscribe(val => this.filteredFolders.next(
			this.folders.filter(option => option.toLowerCase().includes(val.toLowerCase()))
		));

		// Router: Check if we are editing or creating content. Load from API
		const editingContentRoute = route.snapshot.params['route'];
		if (editingContentRoute) {
			this.adminService.getContentPage(editingContentRoute).subscribe(data => {
				this.originalContent = data;
				this._currentDraft = data;

				this.contentForm.patchValue(data);
				this.setFormDisabledState();
			}, err => {
				router.navigateByUrl('/compose');
			});

			this.cmsService.requestContentHistory(editingContentRoute).subscribe(historyList => {
				this.history = historyList;
			});
		}
	}

	/**
	 * Event handler for when the currently viewed version changes
	 * @param event
	 */
	public versionChange(event: MatSelectChange) {
		const c = this.history ? this.history[event.value] : null;

		if (c) {
			// Only store current draft when the user is actually able to draft.
			// The form should be disabled when reviewing history.
			if (!this.contentForm.disabled) {
				this._currentDraft = this.contentForm.value;
			}
			this.contentForm.patchValue(c, { emitEvent: false });
			this.setFormDisabledState();
			return;
		}

		this.contentForm.patchValue(this._currentDraft, { emitEvent: false });
		this.setFormDisabledState(); // Disabled state has to occur BELOW the disabled check above!
	}

	ngOnDestroy() {
		this._ngUnsub.next();
		this._ngUnsub.complete();
	}


	// Implements interface: CanDeactivate<ComposeComponent>
	canDeactivate() {
		// if we've saved, we're fine deactivating!
		if (this._hasSaved) { return true; }

		// if we're not dirty, we can also deactivate
		if (!this.contentForm.dirty) { return true; }

		return this.modalService.openDeactivateComposeModal().afterClosed();
	}

	/**
	 * Form Validation that disallows values that are considered unique for the given property.
	 * @param contentList
	 * @param prop
	 */
	private disallowed(contentList: BehaviorSubject<CmsContent[]>, prop: string) {
		return (control: FormControl): { [key: string]: any } => {
			const list = contentList.getValue();
			if (list && list.some((content) => {
				const val = content[prop].toLowerCase();

				if (this.originalContent) {
					// Only match for equal values that are NOT the same as the originalContent value (which is this draft)
					return (val === control.value.toLowerCase()) && (val !== this.originalContent[prop].toLowerCase());
				}
				return (val === control.value.toLowerCase());
			})) {
				return { alreadyExists: true };
			}
		};
	}

	/**
	 * Presents the user with a modal asking if the he/she wants to apply the old version
	 * a
	 */
	public restoreOldVersion() {
		const c = this.history ? this.history[this.versionIndex] : null;
		if (!c) { return; }

		this.modalService.openRestoreOldVersionModal(
			this.getHistoryItemFormatted(c.version + 1, this.datePipe.transform(c.updatedAt)),
		).afterClosed().subscribe(result => {
			if (!result) { return; }

			this.versionIndex = VersionHistory.Draft;
			this._currentDraft = c;
			this.setFormDisabledState(); // Enable controls (and allow validation)
		});
	}

	/**
	 * Submits the form and hands it over to the cmsService
	 */
	public submitForm() {
		const content: CmsContent = this.contentForm.getRawValue();
		content.route = content.route.toLowerCase();

		// Helper
		const onSubmit = (obs: Observable<CmsContent>) => {
			const sub = obs.subscribe(
				newContent => {
					sub.unsubscribe();
					if (newContent) {
						this.cmsService.getContentList(true);
						this._hasSaved = true;

						if (newContent.published) {
							this.router.navigateByUrl(newContent.route);
						} else {
							this.router.navigateByUrl(''); // redirect to homepage instead.
						}
					}
				},
				error => {
					// TODO: Tell the user why it failed
					sub.unsubscribe();
				},
			);
		};

		if (this.originalContent) {
			// use this.inputContent.route instead of the new route, as we want to update
			// the route might've changed in the form data
			onSubmit(this.cmsService.updateContent(this.originalContent.route, content));
			return;
		}
		onSubmit(this.cmsService.createContent(content));
	}

	/**
	 * Returns the display format of history items
	 * @param ver
	 * @param text
	 */
	public getHistoryItemFormatted(ver: number, text: string): string {
		return `${ver}. ${text}`;
	}


	/**
	 * toggles the disabled status of the folder field
	 */
	public setFormDisabledState() {
		// Disable form for old versions
		if (this.versionIndex !== VersionHistory.Draft) {
			this.contentForm.disable();
			return;
		}
		// Enable form for draft
		if (this.contentForm.disabled) { this.contentForm.enable(); }

		if (this.contentForm.get('nav').value) {
			this.contentForm.get('folder').enable();
		} else {
			this.contentForm.get('folder').disable();
		}
	}
}
