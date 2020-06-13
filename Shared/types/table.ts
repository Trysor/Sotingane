import { FileDropSettings } from './components';

export interface TableSettings<T> {
	columns: ColumnSettings<T>[];
	mobile: Column<T>[];

	// default sort
	active: Column<T>;
	dir: keyof ColumnDir;

	trackBy: (index: number, item: T) => string | number;

	rowClick?: (rowOjb: T) => void;

	fileDrop?: FileDropSettings;
}

export interface TableFilterSettings {
	placeholder?: string;
	func?: (term: string) => void;
	hidden?: any; // BehaviorSubject<boolean>;
}

export interface ColumnSettings<T> {
	type?: ColumnType; // Defaults to Normal

	property: Column<T>;
	header: string;
	val?: (obj?: T, all?: T[]) => string | number;
	val2?: (obj?: T, all?: T[]) => string | number;

	tooltip?: (obj?: T, all?: T[]) => string;
	ariaLabel?: (obj?: T, all?: T[]) => string;

	icon?: ColIconSettings<T>;

	func?: (obj?: T, all?: T[]) => void;
	disabled?: (obj?: T, all?: T[]) => boolean;
	removeText?: boolean;
	narrow?: boolean;
	noSort?: boolean;

	rightAlign?: boolean;
}

export enum ColumnType {
	Button,
	InternalLink,
	ExternalLink,
	Image,
	Normal
}

export type Column<T> = keyof T | keyof ExtraColumns;


interface ExtraColumns {
	edit: string;
	delete: string;
}

interface ColumnDir {
	asc: string;
	desc: string;
}

interface ColIconSettings<T> {
	val: (obj?: T) => string;
	color?: 'primary' | 'accent' | 'warn';
}
