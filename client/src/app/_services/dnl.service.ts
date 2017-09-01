import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

import { GameDig, GameDigStates } from './../_models/gamedig';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/timeout';

@Injectable()
export class DNLService {

  constructor(
    private http: Http,
    private router: Router) {
  }

  queryGameServer(): Observable<{
    message: string; serverState?: GameDig; state: number}> {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const options = new RequestOptions({ headers: headers });
    return this.http.get(environment.URL.queryGameServer, options).timeout(5000)
      .map(
        response => {
          // all successful responses do not necessarily mean the server is up and running etc.
          const json = response.json();
          if (json.serverState) {
            // may still only have PARTIAL information
            json.state = GameDigStates.Success;
          } else if (json.timeout) {
            json.state = GameDigStates.TimedOut;
          } else if (json.offline) {
            json.state = GameDigStates.Error;
          }
          return json;
        },
        error => {
          return Observable.of({
            message: error.text(),
            state: GameDigStates.Error
          });
        }
      ).catch(e => {
        return Observable.of({
          message: 'Request timed out',
          state: GameDigStates.TimedOut
        });
      });
  }
}
