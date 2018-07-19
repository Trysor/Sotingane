import { BehaviorSubject } from 'rxjs';

export interface TableSettings<T> {
	columns: ColumnSettings<T>[];
	mobile: Column<T>[];

	// default sort
	active: Column<T>;
	dir: ColumnDir;

	trackBy: (index: number, item: T) => string;

	rowClick?: (rowOjb: T) => void;
}

export interface TableFilterSettings {
	placeholder?: string;
	func?: (term: string) => void;
	hidden?: BehaviorSubject<boolean>;
}

export interface ColumnSettings<T> {
	type?: ColumnType; // Defaults to Normal

	property: Column<T>;

	header: string;
	val?: (obj?: T, all?: T[]) => string;
	val2?: (obj?: T, all?: T[]) => string;

	tooltip?: (obj?: T, all?: T[]) => string;
	icon?: (obj?: T) => string;

	func?: (obj?: T, all?: T[]) => void;
	disabled?: (obj?: T, all?: T[]) => boolean;
	noText?: boolean;
	narrow?: boolean;
	noSort?: boolean;

	color?: 'primary' | 'accent' | 'warn';

	rightAlign?: boolean;
}

export enum ColumnType {
	Button,
	InternalLink,
	ExternalLink,
	Image,
	Normal
}

export enum ColumnDir {
	ASC = 'asc',
	DESC = 'desc'
}

export type Column<T> = keyof T | keyof ExtraColumns;


interface ExtraColumns {
	edit: string;
	delete: string;
}
