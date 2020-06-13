export interface StatusMessage {
	message: string;
	errors?: ErrorMessage[];
}
export interface ErrorMessage {
	property?: string;
	error: string;
	params: any; // Ajv.ErrorParameters
}
