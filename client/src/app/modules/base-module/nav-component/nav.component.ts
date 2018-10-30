import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Content, CmsFolder } from '@types';
import { CMSService, MobileService } from '@app/services';

import { BehaviorSubject } from 'rxjs';

@Component({
	selector: 'nav-component',
	templateUrl: './nav.component.html',
	styleUrls: ['./nav.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavComponent {
	private _contentSubject = new BehaviorSubject(null);

	public get contentSubject() { return this._contentSubject; }

	/**
	 * Sort arrangement function for Content, CmsFolders and SteamServer, based on either's title.
	 * @param  {Content | CmsFolder}   a object to be sorted
	 * @param  {Content | CmsFolder}   b object to be sorted
	 * @return {number}                                 a's relative position to b.
	 */
	private static sortMethod(a: Content | CmsFolder, b: Content | CmsFolder): number {
		return a.title.localeCompare(b.title);
	}

	constructor(
		public mobileService: MobileService,
		private cmsService: CMSService) {

		// Subscribe to content updates
		cmsService.getContentList().subscribe(contentList => this.updateContentList(contentList));

	}

	/**
	 * Creates and organizes the navigation tree from the Content list provided
	 * @param  {Content[]} contentList the Content list to create the nav tree from
	 */
	private updateContentList(contentList: Content[]) {
		if (!contentList) { return; }

		const rootContent: Content[] = [];
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
	 * @param  {Content | CmsFolder}   item the item tracked
	 * @return {string}                   the item's title; used for tracking
	 */
	trackBy(index: number, item: Content | CmsFolder): string {
		return item.title;
	}
}
