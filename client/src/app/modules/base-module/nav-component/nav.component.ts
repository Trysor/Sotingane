import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Content, CmsFolder } from '@types';
import { CMSService } from '@app/services';

import { BehaviorSubject } from 'rxjs';

@Component({
	selector: 'nav-component',
	templateUrl: './nav.component.html',
	styleUrls: ['./nav.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavComponent {
	public readonly contentSubject = new BehaviorSubject(null);

	/**
	 * Sort arrangement function for Content, CmsFolders and SteamServer, based on either's title.
	 */
	private static sortMethod(a: Content | CmsFolder, b: Content | CmsFolder): number {
		return a.title.localeCompare(b.title);
	}

	constructor(private cmsService: CMSService) {
		// Subscribe to content updates
		this.cmsService.getContentList().subscribe(contentList => this.updateContentList(contentList));
	}

	/**
	 * Creates and organizes the navigation tree from the Content list provided
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
					title: content.folder,
					content: [content],
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
		this.contentSubject.next({
			rootContent,
			folders
		});
	}

	/**
	 * Helper function for angular's *ngFor
	 */
	trackBy(index: number, item: Content | CmsFolder): string {
		return item.title;
	}
}
