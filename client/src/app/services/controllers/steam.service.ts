import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '@env';
import { GameDig, SteamServer } from '@app/models';

import { HttpService } from '@app/services/http/http.service';

import { Observable, BehaviorSubject } from 'rxjs';
import { timeout } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class SteamService {
	// Remembers one server at a time
	private _serverData = new BehaviorSubject<GameDig>(null);

	constructor(
		private http: HttpService,
		private router: Router) {
	}

	/**
	 * Get the stored server data
	 * @return {BehaviorSubject<GameDig>} the stored server data
	 */
	public getServerData(): BehaviorSubject<GameDig> {
		return this._serverData;
	}

	/**
	 * Query for all steam servers
	 */
	public requestSteamServers(): Observable<SteamServer[]> {
		return this.http.get<SteamServer[]>(environment.URL.steam.servers).pipe(timeout(environment.TIMEOUT));
	}

	/**
	 * Query the server for updated Steam Server data
	 * @param  {string} route the route assgined for the steam server
	 */
	public requestSteamServer(route: string): Observable<SteamServer> {
		return this.http.get<SteamServer>(environment.URL.steam.servers + '/' + route).pipe(timeout(environment.TIMEOUT));
	}

	/**
	 * Query the server for updated Steam Server data
	 * @param  {string} route the route assgined for the steam server
	 */
	public querySteamServerData(route: string) {
		this.http.get<GameDig>(environment.URL.steam.servers + '/' + route + '/data')
			.pipe(timeout(environment.TIMEOUT)).subscribe(
				data => {
					data.lastUpdate = new Date();
					const now = new Date().valueOf();
					for (const player of data.players) {
						player.timeDate = new Date(now - player.time * 1000);
					}
					console.log(data);
					this._serverData.next(data);
				}
				// err => { this._serverData.next(err); }
			);
	}
}
