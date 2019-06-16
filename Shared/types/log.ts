import { User } from './user';
import { ContentEntry } from './content';

export interface Log {
	user?: User;
	route: string;
	content: ContentEntry;
	browser?: string;
	browser_ver?: string;
	ts: Date;
	_id: any;
}
