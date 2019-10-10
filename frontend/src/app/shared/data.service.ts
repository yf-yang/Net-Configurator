import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImportDataModel } from '../topology/net-topology-data-import/models/import-data-model';
import { AppConfig } from './app-config';
import { map } from 'rxjs/operators';
import { LinkDataQuery } from './interfaces/data/link-data-query';
import { NodeDataQuery } from './interfaces/data/node-data-query';
import { RouteModel } from './models/route/route-model';
import { CoreService } from './core.service';
import { IpMessageData } from './interfaces/messages/ip-message-data';
import { BackendDataInterface } from '../topology/net-topology-data-import/interfaces/backend-data-interface';
import { ImportLinkDataModel } from '../topology/net-topology-data-import/models/import-link-data-model';
import { BackendDumpData } from '../topology/net-topology-data-import/interfaces/backend-dump-data';
import { BwDirectionModel } from './models/bandwidth/bw-direction-model';
import { MulticastGroupData } from './interfaces/messages/multicast-group-data';
import { NodeProfileModel } from './models/node-profile-model';
import { MessageData } from './interfaces/message-data';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private http: HttpClient,
    private coreService: CoreService
  ) { }

  public getAllData(): Observable<ImportDataModel> {
    return this.http.get<BackendDataInterface>(AppConfig.REST_BASE_URL).pipe(
      map(res => new ImportDataModel(res))
    );
  }

  public createNode(query: NodeDataQuery, name: string): Observable<NodeProfileModel> {
    const body = {
      name: name
    };

    return this.http.post(AppConfig.REST_BASE_URL + 'node', body, {params: query}).pipe(
      map(res => this.coreService.extractObjectDataToArray(res, NodeProfileModel)[0])
    );
  }

  public editNode(nodeId: string, query: NodeDataQuery) {
    return this.http.put(AppConfig.REST_BASE_URL + 'node/' + nodeId, query);
  }

  public removeNode(nodeId: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: {}
    };

    return this.http.request('delete', AppConfig.REST_BASE_URL + 'node/' + nodeId, options);
  }

  public createLink(query: LinkDataQuery[]): Observable<ImportLinkDataModel[]> {
    return this.http.post(AppConfig.REST_BASE_URL + 'link', query).pipe(
      map(res => this.coreService.extractObjectDataToArray(res, ImportLinkDataModel))
    );
  }

  public removeLink(linkId: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: {}
    };

    return this.http.request('delete', AppConfig.REST_BASE_URL + 'link/' + linkId, options);
  }

  public addMessage(query: MessageData): Observable<MessageData> {
    const params = {
      traffic_type: 'IP'
    };

    return this.http.post(AppConfig.REST_BASE_URL + 'traffic', query, {params: params}).pipe(
      map(res => {
        const resId = this.extractId(res);
        const profile: MessageData = res[resId];
        profile.id = resId;

        return profile;
      })
    );
  }

  public editMessage(query: IpMessageData, msgId: string) {
    return this.http.put(AppConfig.REST_BASE_URL + 'traffic/' + msgId, query).pipe(
      map(res => this.extractId(res))
    );
  }

  public removeMessage(msgId: string) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: {}
    };

    return this.http.request('delete', AppConfig.REST_BASE_URL + 'traffic/' + msgId, options);
  }

  public addMulticastGroup(query: MulticastGroupData) {
    return this.http.post(AppConfig.REST_BASE_URL + 'multicast_group', query).pipe(
      map(res => {
        const resId = this.extractId(res);
        const profile: MulticastGroupData = res[resId];
        profile.id = resId;

        return profile;
      })
    );
  }

  public removeMulticastGroup(mgId: string) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: {}
    };

    return this.http.request('delete', AppConfig.REST_BASE_URL + 'multicast_group/' + mgId, options);
  }

  public getRoute(msgId: string, msgType: string, flinkId?: string): Observable<RouteModel[]> {
    const params: any = {};

    params.traffic = msgId;
    params.method = msgType;

    if (flinkId) {
      params.flink = flinkId;
    }

    return this.http.get(AppConfig.REST_BASE_URL + 'simulate/routes', {params: params}).pipe(
      map(res => this.coreService.extractListData(res as Array<any>, RouteModel))
    );
  }

  public dumpBackend(): Observable<BackendDumpData> {
    return this.http.get<BackendDumpData>(AppConfig.REST_BASE_URL + 'dump');
  }

  public setBackendData(data: BackendDumpData): Observable<BackendDataInterface> {
    return this.http.put<BackendDataInterface>(AppConfig.REST_BASE_URL + 'load', data);
  }

  public getBandwidth(flinkId?: string): Observable<BwDirectionModel[]> {
    const params: any = {};

    if (flinkId) {
      params.flink = flinkId;
    }

    return this.http.get(AppConfig.REST_BASE_URL + 'simulate/bandwidth', {params: params}).pipe(
      map(res => this.coreService.extractObjectDataToArray(res, BwDirectionModel))
    );
  }

  public resetBackendData(): Observable<any> {
    return this.http.put(AppConfig.REST_BASE_URL + 'load', null);
  }

  public importFile(file: File): Observable<ImportDataModel> {
    const body = new FormData();
    body.append('file', file, file.name);

    return this.http.put<BackendDataInterface>(AppConfig.REST_BASE_URL + 'import', body).pipe(
      map(res => new ImportDataModel(res))
    );
  }

  public generatePolicies(): Observable<Blob> {
    const headers = new HttpHeaders({
      'Cache-Control':  'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return this.http.get(AppConfig.REST_BASE_URL + 'generate', {responseType: 'blob', headers: headers});
  }

  public setSwitchAsController(swId: string, role: 'AGENT' | 'CONTROLLER'): Observable<any> {
    const body = {
      role: role
    };

    return this.http.put(AppConfig.REST_BASE_URL + 'node/' + swId, body);
  }

  private extractId(obj: any): string {
    return Object.keys(obj)[0];
  }
}
