import { User } from './user';
export interface File {
	data: Buffer;
	uploadedBy: User;
	uploadedDate?: Date;
	filename: string;
	hash: string;
	mimeType: string;
	thumbnail: boolean;
}
