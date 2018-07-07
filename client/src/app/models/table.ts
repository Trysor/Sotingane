import { BehaviorSubject } from 'rxjs';

export interface TableSettings {
	columns: ColumnSettings[];
	mobile: string[];

	// default sort
	active: string; // property
	dir: ColumnDir;

	trackBy: (index: number, item: any) => string;

	rowClick?: (rowOjb: object) => void;
}

export interface TableFilterSettings {
	placeholder?: string;
	func?: (term: string) => void;
	hidden?: BehaviorSubject<boolean>;
}


export interface ColumnSettings {
	header: string;

	property: string;
	value?: (obj: object) => any;

	type?: ColumnType; // Defaults to Normal
	displayFormat?: (obj?: object, all?: object[]) => string;

	func?: (obj?: object, all?: object[]) => void;
	disabled?: (obj?: object, all?: object[]) => boolean;
	icon?: (obj?: object) => string;
	tooltip?: (obj?: object) => string;
	noText?: boolean;
	narrow?: boolean;

	color?: 'primary' | 'accent' | 'warn';

	// classes
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

export enum ColumnDir {
	ASC = 'asc',
	DESC = 'desc'
}
