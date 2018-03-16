/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
	id: string;
}

declare var ClassicEditor;

interface CKEditor {
	getData(): string;
	setData(html: string): void;
	destroy(): void;
	listenTo(emitter: object, event: string, callback: any): any;
	isReadOnly: boolean;
	model: {
		document: object;
	};
}
