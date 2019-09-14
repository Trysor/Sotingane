import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import FileRepository from '@ckeditor/ckeditor5-upload/src/filerepository';

import { CustomUploadAdapterOptions } from '../../../Shared/types';

export default class CustomUploadAdapter extends Plugin {
	static get requires() { return [FileRepository]; }

	static get pluginName() { return 'CustomUploadAdapter'; }

	init() {
		(this as any).editor.plugins.get(FileRepository).createUploadAdapter = loader => {
			return new Adapter(loader, (this as any).editor.config.get('customUpload'));
		};
	}
}

class Adapter {
	private _loader: any;
	private _options: CustomUploadAdapterOptions;
	private _cancelFunc: () => void;


	constructor(loader: any, options: CustomUploadAdapterOptions) {
		this._loader = loader;
		this._options = options;
	}

	public upload() {
		return this._loader.file.then( (file: any) => {
			const returnValueObject = this._options.fileUploader(file, this.updateProgressCallback.bind(this));
			this._cancelFunc = returnValueObject.cancelFunc;

			return returnValueObject.promise;
		});
	}

	public abort() {
		this._cancelFunc();
	}

	private updateProgressCallback(total: number, uploaded: number) {
		this._loader.uploadTotal = total;
		this._loader.uploaded = uploaded;
	}
}


