import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import AttributeCommand from '@ckeditor/ckeditor5-basic-styles/src/attributecommand';

import codeIcon from 'code.svg';
// import '../../theme/code.css';

const CODE = 'code';


export default class CodePlugin extends Plugin {
	init() {
		const editor = (<any>this).editor;
		const t = editor.t;

		// Allow code attribute on text nodes.
		editor.model.schema.extend('$text', { allowAttributes: CODE });

		editor.conversion.attributeToElement({
			model: CODE,
			view: 'code',
			upcastAlso: {
				styles: {
					'word-wrap': 'break-word'
				}
			}
		});

		// Create code command.
		editor.commands.add(CODE, new AttributeCommand(editor, CODE));

		// Add code button to feature components.
		editor.ui.componentFactory.add(CODE, locale => {
			const command = editor.commands.get(CODE);
			const view = new ButtonView(locale);

			view.set({
				label: t('Code'),
				icon: codeIcon,
				tooltip: true
			});

			view.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

			// Execute command.
			(<any>this).listenTo(view, 'execute', () => editor.execute(CODE));
			return view;
		});
	}
}
