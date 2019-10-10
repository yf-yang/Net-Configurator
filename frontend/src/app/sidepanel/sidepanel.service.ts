import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToolbarModel } from '../shared/models/toolbar/toolbar-model';
import { CoreService } from '../shared/core.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SidepanelService {

  constructor(
    private http: HttpClient,
    private coreService: CoreService
  ) { }

  public getToolbars(): Observable<ToolbarModel[]> {
    return this.http.get('/assets/data/toolbars.json').pipe(
      map((res) => this.coreService.extractListData(res as Array<any>, ToolbarModel))
    );
  }

}
