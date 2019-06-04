
import { CmsAccess, AccessRoles } from '@types';


export class AccessHandler {
	public readonly accessChoices: CmsAccess[] = [
		{ value: null,					icon: 'group',			single: 'Everyone',		plural: 'Everyone'	},
		{ value: AccessRoles.member,	icon: 'verified_user',	single: 'Member',		plural: 'Members'	},
		{ value: AccessRoles.writer, 	icon: 'text_fields',	single: 'Writer',		plural: 'Writers'	},
		{ value: AccessRoles.admin,		icon: 'security',		single: 'Admin',		plural: 'Admins'	}
	];

	/**
	 * returns the CmsAccess value of the selected access privileges
	 * @return {CmsAccess} the selected value
	 */
	public getAccessChoice(role: AccessRoles): CmsAccess {
		return this.accessChoices.find(choice => role === choice.value);
	}

	public getRolesFromAccessList(roles: AccessRoles[]): string {
		if (roles && roles.length > 0) {
			return roles.map(role => this.getAccessChoice(role).single).join(', ');
		} else {
			return this.getAccessChoice(null).single;
		}
	}
}
