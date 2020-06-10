import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';


import { ModalData, ImageModalData, Content, StatusMessage } from '@types';

import { ModalComponent } from '@app/modules/shared-module/modals/modal.component';
import { ImageModalComponent } from '@app/modules/shared-module/modals/imagemodal.component';
import { LoginComponent } from '@app/modules/base-module/login-component/login.component';


@Injectable({ providedIn: 'root' })
export class ModalService {

	constructor(private dialog: MatDialog) { }

	/**
	 * Opens login modal
	 */
	public openLoginModal() {
		return this.dialog.open(LoginComponent);
	}


	/**
	 * Opens a generic modal with the provided header and body
	 */
	public openGenericInfoModal(header: string, body: string) {
		const data: ModalData = {
			headerText: header,
			bodyText: body,
			proceedText: 'Okay'
		};
		return this.dialog.open(ModalComponent, { data } as MatDialogConfig<ModalData>);
	}



	/**
	 * Opens a delete content modal for the given content item
	 */
	public openHTTPErrorModal(status: StatusMessage) {
		const data: ModalData = {
			headerText: `An Error has occured!`,
			bodyText: status.message,
			proceedText: 'Okay'
		};
		return this.dialog.open(ModalComponent, { data } as MatDialogConfig<ModalData>);
	}


	/**
	 * Opens a delete content modal for the given content item
	 */
	public openDeleteContentModal(content: Content) {
		const data: ModalData = {
			headerText: `Delete ${content.title}`,
			bodyText: 'Do you wish to proceed?',
			proceedText: 'Delete', proceedColor: 'warn',
			cancelText: 'Cancel', cancelColor: 'accent',
		};
		return this.dialog.open(ModalComponent, { data } as MatDialogConfig<ModalData>);
	}

	/**
	 * Opens a deactivation warning modal
	 */
	public openDeactivateComposeModal() {
		const data: ModalData = {
			headerText: 'Unsaved work!',
			bodyText: 'Do you wish to proceed without saving?',
			proceedColor: 'accent', proceedText: 'Proceed',
			cancelColor: 'primary', cancelText: 'Cancel',
		};
		return this.dialog.open(ModalComponent, { data } as MatDialogConfig<ModalData>);
	}

	/**
	 * Opens a restore old version modal
	 */
	public openRestoreOldVersionModal(version: string) {
		const data: ModalData = {
			headerText: `Restore version ${version}`,
			bodyText: 'Do you wish to replace your current draft with this version?',
			proceedText: 'Proceed', proceedColor: 'warn',
			cancelText: 'Cancel',
		};

		return this.dialog.open(ModalComponent, { data } as MatDialogConfig<ModalData>);
	}

	/**
	 * Opens a password change success state modal
	 */
	public openPasswordChangeModal(success: boolean) {
		const data: ModalData = {
			headerText: success ? 'Password updated!' : 'Failure',
			bodyText: success ? 'Your password was successfully updated.'
							  : 'Could not update your password.',

			proceedColor: 'primary',
			proceedText: 'Okay',
		};
		return this.dialog.open(ModalComponent, { data } as MatDialogConfig<ModalData>);
	}

	/**
	 * Opens a modal displaying an image
	 */
	public openImageModal(data: ImageModalData) {
		this.dialog.open(ImageModalComponent, { data, panelClass: 'imagemodal', autoFocus: false } as MatDialogConfig);
	}
}
