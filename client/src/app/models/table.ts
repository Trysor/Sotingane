import { BehaviorSubject } from 'rxjs';

export interface TableSettings<T> {
	columns: ColumnSettings<T>[];
	mobile: string[];

	// default sort
	active: string; // property
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

	property: string;

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
