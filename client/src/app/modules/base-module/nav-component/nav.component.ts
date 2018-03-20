import { Component, ChangeDetectionStrategy } from '@angular/core';

import { CmsContent, CmsFolder, SteamServer } from '@app/models';
import { CMSService, SteamService, MobileService } from '@app/services';

import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'nav-component',
	templateUrl: './nav.component.html',
	styleUrls: ['./nav.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavComponent {
	private _ngUnsub = new Subject();

	private _contentSubject = new BehaviorSubject(null);

	public get contentSubject() { return this._contentSubject; }

	/**
	 * Sort arrangement function for CmsContent, CmsFolders and SteamServer, based on either's title.
	 * @param  {CmsContent | CmsFolder}   a object to be sorted
	 * @param  {CmsContent | CmsFolder}   b object to be sorted
	 * @return {number}                                 a's relative position to b.
	 */
	private static sortMethod(a: CmsContent | CmsFolder, b: CmsContent | CmsFolder): number {
		return a.title.localeCompare(b.title);
	}

	constructor(
		public mobileService: MobileService,
		private cmsService: CMSService) {

		// Subscribe to content updates
		cmsService.getContentList().subscribe(contentList => this.updateContentList(contentList));

	}

	/**
	 * Creates and organizes the navigation tree from the CmsContent list provided
	 * @param  {CmsContent[]} contentList the CmsContent list to create the nav tree from
	 */
	private updateContentList(contentList: CmsContent[]) {
		if (!contentList) { return; }

		const rootContent: CmsContent[] = [];
		const folders: CmsFolder[] = [];
		for (const content of contentList) { // (nav is filtered server-side)
			if (!content.folder) {
				rootContent.push(content);
				continue;
			}
			const folder = folders.find(f => f.title === content.folder);
			if (!folder) {
				folders.push({
					'title': content.folder,
					'content': [content],
				});
				continue;
			}
			folder.content.push(content);
		}
		// sort
		rootContent.sort(NavComponent.sortMethod);
		folders.sort(NavComponent.sortMethod);
		for (const folder of folders) { folder.content.sort(NavComponent.sortMethod); }
		// Push
		this._contentSubject.next({
			rootContent: rootContent,
			folders: folders
		});
	}

	/**
	 * Helper function for angular's *ngFor
	 * @param  {number}                   index the index of the item to track
	 * @param  {CmsContent | CmsFolder}   item the item tracked
	 * @return {string}                   the item's title; used for tracking
	 */
	trackBy(index: number, item: CmsContent | CmsFolder): string {
		return item.title;
	}
}
