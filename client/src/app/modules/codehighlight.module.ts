import { NgModule } from '@angular/core';

import * as Prism from 'prismjs';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';

@NgModule({})
export class CodeHighlightModule {
	public static Prism = Prism;



	public static highlightFor(parent: HTMLElement, preElements: NodeListOf<HTMLPreElement>) {
		if (!preElements || preElements.length === 0) { return; }

		// tslint:disable-next-line: prefer-for-of
		for (let i = 0; i < preElements.length; i++) {
			const codeElClassList = preElements[i].children.item(0).classList;

			// tslint:disable-next-line: prefer-for-of
			for (let j = 0; j < codeElClassList.length; j++) {
				if (codeElClassList[j].startsWith('language-')) {
					preElements[i].setAttribute('lang', codeElClassList[j].substring(9));
					break;
				}
			}

			preElements[i].classList.add('line-numbers');
		}
		Prism.highlightAllUnder(parent);
	}
}
