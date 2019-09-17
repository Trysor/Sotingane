export interface CustomUploadAdapterOptions {
	fileUploader: (file: File, updateProgressCallback: UpdateProgressCallback) => FileUploaderReturnValue;
}

interface FileUploaderReturnValue {
	promise: Promise<File>;
	cancelFunc: () => void;
}

type UpdateProgressCallback = (total: number, uploaded: number) => void;
