import { Content, ImageContentData } from './content';
export interface DynamicComponent {
	buildJob(el?: Element, content?: Content): void;
}

export interface ModalData {
	headerText: string;
	bodyText: string;

	proceedColor?: string;
	proceedText: string;

	cancelColor?: string;
	cancelText?: string;
}

export interface ImageModalData {
	images: ImageContentData[];
	startIndex: number;
}

export interface FileDropSettings {
	multiple: boolean;
	accept: string;
	fileHandler: (fileList: FileList | File[]) => void | Promise<void>;
}
