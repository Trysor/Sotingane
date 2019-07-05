import { DatePipe } from '@angular/common';

import { Content } from '@types';


enum VersionHistory { Draft = -1 }

export class HistoryHandler {
	// PIPES
	private readonly _datePipe: DatePipe;

	// HISTORY FIELDS
	private _history: Content[] = null;
	private _historyVersionIndex: number = VersionHistory.Draft;
	// DRAFTING FIELDS
	private _storedWorkingDraft: Content; // Used for storing draft inbetween history version changes


	public get VersionHistory() { return VersionHistory; }
	public get HistoryValue() { return this._history ? this._history[this._historyVersionIndex] : null; }
	public get HistoryList() { return this._history; }
	public get isDrafting() { return this._historyVersionIndex === VersionHistory.Draft; }
	public get hasHistory() { return !!this._history && this._history.length > 0; }


	public get HistoryVersionIndex() { return this._historyVersionIndex; }
	public set HistoryVersionIndex(value: number) { this._historyVersionIndex = value; }




	constructor(datePipe: DatePipe) {
		this._datePipe = datePipe;
	}


	// ---------------------------------------
	// ----------- HELPER METHODS ------------
	// ---------------------------------------

	public setHistoryList(list: Content[]) {
		this._history = list;
	}

	public setWorkingDraft(draft: Content) {
		this._storedWorkingDraft = draft;
	}


	/**
	 * Reconfigures drafting and returns the history item that was selected if one exists,
	 * otherwise the stored working draft is returned.
	 * @param newDraft OPTIONAL. Only privded IF one wishes to override the stored working draft!
	 */
	public reconfigureAfterVersionChange(newDraft: Content = null) {
		if (newDraft) {
			this._storedWorkingDraft = newDraft;
		}

		if (this.isDrafting) { return this._storedWorkingDraft; }
		return this.HistoryValue;
	}


	// ---------------------------------------
	// ------- HTML FORMATTING HELPERS -------
	// ---------------------------------------

	/**
	 * Returns the display format of history items
	 */
	public getHistoryItemFormatted(historyIndex: number) {
		if (historyIndex === null) {
			historyIndex = this.HistoryVersionIndex;
		}

		if (historyIndex === VersionHistory.Draft) {
			if (this.HistoryList === null || this.HistoryList.length === 0) {
				return this.formattedHistoryTextOutput(1, 'Draft');
			}
			return this.formattedHistoryTextOutput(this.HistoryList[0].version + 2, 'Current draft');
		}

		const historyContent = this.HistoryList[historyIndex];
		if (!historyContent) { return 'Unknown history item'; }

		return this.formattedHistoryTextOutput(
			historyContent.version + 1,
			this._datePipe.transform(historyContent.updatedAt)
		);
	}

	private formattedHistoryTextOutput(version: number, text: string) {
		return `${version}. ${text}`;
	}
}
