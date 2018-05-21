
export interface ModalData {
	headerText: string;
	bodyText: string;

	proceedColor?: string;
	proceedText: string;

	cancelColor?: string;
	cancelText?: string;
}

export interface ImageModalData {
	src: string;
	alt: string;
	images?: string[];
	index?: number;
}
