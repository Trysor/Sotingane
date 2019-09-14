import { Request as Req, Response as Res, NextFunction as Next } from 'express';
import * as Ajv from 'ajv';
import { ErrorObject } from 'ajv';

import { StatusMessage, ErrorMessage } from 'types';

/*
 |--------------------------------------------------------------------------
 | AJV
 |--------------------------------------------------------------------------
*/

const ajv = new Ajv({ allErrors: true });


export const validate = (schema: SchemaValidationObject) => {
	return (req: Req, res: Res, next: Next): Res => {
		const valid = ajv.validate(schema.name, req.body);
		if (!valid) {
			return res.status(422).send(status(schema.err, ajv.errors));
		}
		next();
	};
};

/**
 * Property Decorator: Registers the schema into AJV.
 * Also assigns the $id field its name, given the validation object
 */
export const RegisterSchema = (schemaValidationObject: SchemaValidationObject) => {
	return (target: any, propertyKey: string | symbol) => {
		const schema = target[propertyKey];
		schema.$id = schemaValidationObject.name;

		if (ajv.validateSchema(schema)) {
			ajv.addSchema(schema, schemaValidationObject.name);
		} else {
			throw Error(`${schemaValidationObject.name} did not validate`);
		}
	};
};


/**
 * Returns a status formatted json object containing the message and any error messages given
 */
export const status = (value: string, errors?: ErrorObject[]): StatusMessage => {
	const msg: StatusMessage = { message: value };
	if (errors) {
		msg.errors = errors.map(error => {
			const obj: ErrorMessage = {
				error: error.message,
				params: error.params
			};
			if (error.dataPath) {
				obj.property = error.dataPath.substring(1, error.dataPath.length);
			}
			return obj;
		});
	}
	return msg;
};

export const JSchema: SchemaValidation = {
	// User
	UserLoginSchema: {
		name: 'UserLoginSchema',
		err: VALIDATION_FAILED.USER_MODEL
	},
	UserRegistrationSchema: {
		name: 'UserRegistrationSchema',
		err: VALIDATION_FAILED.USER_MODEL
	},
	UserUpdatePasswordSchema: {
		name: 'UserUpdatePasswordSchema',
		err: VALIDATION_FAILED.USER_MODEL
	},
	UserAdminUpdateUser: {
		name: 'UserAdminUpdateUser',
		err: VALIDATION_FAILED.USER_MODEL
	},

	// Content
	ContentSchema: {
		name: 'ContentSchema',
		err: VALIDATION_FAILED.CONTENT_MODEL
	},

	// Admin
	AdminAggregationSchema: {
		name: 'AdminAggregationSchema',
		err: VALIDATION_FAILED.ADMIN_MODEL
	},

	// Settings
	SettingsSchema: {
		name: 'SettingsSchema',
		err: VALIDATION_FAILED.SETTING_MODEL
	},

	// Theme
	ThemeSchema: {
		name: 'ThemeSchema',
		err: VALIDATION_FAILED.THEME_MODEL
	},
};


/*
 |--------------------------------------------------------------------------
 | Status Messages
 |--------------------------------------------------------------------------
*/

export const enum VALIDATION_FAILED {
	USER_MODEL = 'User object validation failed',
	CONTENT_MODEL = 'Content object validation failed',
	ADMIN_MODEL = 'Query object validation failed',
	SETTING_MODEL = 'Setting object validation failed',
	THEME_MODEL = 'Theme object validation failed'
}




export const enum ROUTE_STATUS {
	INVALID = 'The requested route does not exist. Did you forget a param?',
	UNAUTHORISED = 'Unauthorized'
}



export const enum AUTH_STATUS {
	NO_USERNAME_OR_PASSWORD = 'Missing username or password',
	NO_OR_BAD_ROLE = 'Missing or bad role',
	USERNAME_NOT_AVILIABLE = 'Username already taken',
	USER_ID_NOT_FOUND = 'The provided ID doesn\'t exist',
	USER_LOGGED_OUT = 'The user has been successfully logged out',
	ACCOUNT_CREATED = 'Account created',
	ACCOUNT_DELETED = 'Account successfully deleted',
	NO_PASSWORD_OR_NEW_PASSWORDS = 'Missing password, newPassword or confirm',
	PASSWORD_AND_CONFIRM_NOT_EQUAL = 'newPassword and confirm are not equal',
	PASSWORD_DID_NOT_MATCH = 'Password did not match the current password',
	PASSWORD_UPDATED = 'Password has been successfully updated',
}

export const enum CMS_STATUS {
	NO_ROUTES = 'No routes were found',
	CONTENT_NOT_FOUND = 'Could not retrieve content for the provided route',
	DATA_UNPROCESSABLE = 'The provided data could not be processed',
	DATA_UNABLE_TO_SAVE = 'Could not save. Internal server error',
	CONTENT_DELETED = 'Content was successfully deleted',
	SEARCH_RESULT_NONE_FOUND = 'Could not find content for the given search query',
	SEARCH_RESULT_MONGOOSE_ERROR = 'There was an issue processing the search query',
}

export const enum ADMIN_STATUS {
	AGGREGATION_RESULT_NONE_FOUND = 'Could not find data for the given query',
	AGGREGATION_MONGOOSE_ERROR = 'There was an issue processing the aggregation',
}

export const enum USERS_STATUS {
	DATA_UNPROCESSABLE = 'The provided data could not be processed',
	USER_UPDATED = 'User has been updated successfully',
	USERNAME_NOT_AVILIABLE = 'Username already taken',
}

export const enum SETTINGS_STATUS {
	DATA_UNPROCESSABLE = 'The provided data could not be processed',
	SETTINGS_UPDATED = 'Settings has been updated successfully',
	SETTINGS_NONE_FOUND = 'Could not find settings',
}

export const enum THEME_STATUS {
	DATA_UNPROCESSABLE = 'The provided data could not be processed',
	THEME_UPDATED = 'Theme has been updated successfully',
	THEME_NONE_FOUND = 'Could not find theme',
}

export const enum FILE_STATUS {
	NO_FILES_FOUND = 'No files were found',
	ERROR_BAD_FILE = 'Bad request',
	ERROR_BAD_UPLOAD_FOLDER = 'Cannot process your request',
	ERROR_IMAGE_TOO_LARGE = 'Image too large',
	ERROR_WRITING = 'Could not complete request'
}


interface SchemaValidation {
	[key: string]: SchemaValidationObject;
}

interface SchemaValidationObject {
	name: string;
	err: VALIDATION_FAILED;
}
