
import { CmsAccess, AccessRoles } from '@app/models';


export class AccessHandler {
	public readonly accessChoices: CmsAccess[] = [
		{ value: AccessRoles.everyone, verbose: 'Everyone', icon: 'group' },
		{ value: AccessRoles.user, verbose: 'Users', icon: 'verified_user' },
		{ value: AccessRoles.admin, verbose: 'Admins', icon: 'security' }
	];

	/**
	 * returns the CmsAccess value of the selected access privileges
	 * @return {CmsAccess} the selected value
	 */
	public getAccessChoice(role: AccessRoles): CmsAccess {
		return this.accessChoices.find(choice => role === choice.value);
	}
}
