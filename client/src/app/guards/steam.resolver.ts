import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { SteamServer } from '@app/models';
import { SteamService } from '@app/services';

import { Observable } from 'rxjs/Observable';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';

@Injectable()
export class SteamResolver implements Resolve<SteamServer | boolean> {
  constructor(private steamService: SteamService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SteamServer | boolean> {
    return this.steamService.requestSteamServer(route.params.serverRoute).pipe( catchError(err => of(false)) );
  }
}
