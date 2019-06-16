import { Injectable } from '@angular/core';

import { HttpService } from '@app/services/http/http.service';

import { env } from '@env';
import { User, Content, AggregationResult, AggregationQuery } from '@types';


@Injectable({ providedIn: 'root' })
export class AdminService {

	constructor(private http: HttpService) { }


	// ---------------------------------------
	// ------------- HTTP METHODS ------------
	// ---------------------------------------

	public getAllusers() {
		return this.http.client.get<User[]>(env.API.admin.users);
	}

	public patchUser(user: User) {
		return this.http.client.patch<boolean>(`${env.API.admin.users}/${user._id}`, user);
	}

	public getAllContent() {
		return this.http.client.get<Content[]>(env.API.admin.cms);
	}

	public getContentPage(route: string) {
		return this.http.client.get<Content>(`${env.API.admin.cms}/${route}`);
	}

	public getAggregatedData(query: AggregationQuery) {
		return this.http.client.post<AggregationResult[]>(env.API.admin.aggregate, query);
	}
}
