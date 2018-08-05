
import { CmsAccess, AccessRoles } from '@app/models';


export class AccessHandler {
	public readonly accessChoices: CmsAccess[] = [
		{ value: AccessRoles.everyone,	icon: 'group',			single: 'Everyone',		plural: 'Everyone'	},
		{ value: AccessRoles.user,		icon: 'verified_user',	single: 'User',			plural: 'Users'		},
		{ value: AccessRoles.admin,		icon: 'security',		single: 'Admin',		plural: 'Admins'	}
	];

	/**
	 * returns the CmsAccess value of the selected access privileges
	 * @return {CmsAccess} the selected value
	 */
	public getAccessChoice(role: AccessRoles): CmsAccess {
		return this.accessChoices.find(choice => role === choice.value);
	}
}
