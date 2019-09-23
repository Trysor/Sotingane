import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ImageEditing from '@ckeditor/ckeditor5-image/src/image/imageediting';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Command from '@ckeditor/ckeditor5-core/src/command';
import { insertImage, isImageAllowed } from '@ckeditor/ckeditor5-image/src/image/utils';

import { CKEFileStoreOptions, FileURLPayload } from '../../types';

const FILESTORE = 'FileStore';
import fileStoreIcon from './FileStore.svg';

export default class FileStorePlugin extends Plugin {
	static get pluginName() { return 'FileStore'; }
	static get requires() { return [ImageEditing]; }

	init() {
		const editor = (this as any).editor;
		const t = editor.t;

		// Register the command
		editor.commands.add(FILESTORE, new FileStoreCommand(editor) );

		editor.ui.componentFactory.add(FILESTORE, locale => {
			const command = editor.commands.get(FILESTORE);
			const view = new ButtonView(locale);

			view.set({
				label: t('Image'),
				icon: fileStoreIcon,
				// keystroke: 'CTRL+J',
				tooltip: true,
				isToggleable: false
			});

			view.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

			// Execute command.
			(this as any).listenTo(view, 'execute', () => editor.execute(FILESTORE));

			return view;
		});
	}
}

class FileStoreCommand extends Command {

	constructor(editor: any) {
		super(editor);
	}
	refresh() {
		(this as any).isEnabled = isImageAllowed( (this as any).editor.model );
	}

	async execute(options: any) {
		const editor = (this as any).editor;
		const model = editor.model;
		const pluginOptions = (this as any).editor.config.get('fileStore') as CKEFileStoreOptions;

		const payload = await pluginOptions.openGUI();

		model.change((writer: any) => {
			if (!payload) { return; } // make sure model.change occurs. Else the cursor moves to the top.
			insertImage(writer, model, this.createAttributesObjectFromPayload(payload));
		});
	}

	private createAttributesObjectFromPayload(payload: FileURLPayload) {
		let largestSize = 0;
		const srcset: string[] = [];
		for (const key of Object.keys(payload.urls)) {
			if (key === 'default' || !payload.urls.hasOwnProperty(key)) { continue; }
			largestSize = Math.max(largestSize, Number(key));
			srcset.push(`${payload.urls[key]} ${key}w`);
		}
		// srcsetAttributeConverter() converts the srcset object into the corresponding dom attributes.
		// srcsetAttributeConverter is added to the downcast conversions list for images in
		// the ImageEditing plugin (see required plugins above)
		return {
			src: payload.urls.default,
			srcset: {
				data: srcset.join(', '),
				width: largestSize
			}
		};
	}
}
