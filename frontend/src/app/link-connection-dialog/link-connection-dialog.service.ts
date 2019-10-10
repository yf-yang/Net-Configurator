import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { NetNodeDataModel } from '../topology/net-topology-data/net-node-data-model';
import { LinkConnectedEvent } from '../shared/topology/interfaces/events/link-connected-event';

@Injectable()
export class LinkConnectionDialogService {

  public isConnectionDialogOpenSubject = new Subject<NetNodeDataModel>();
  public linkConnectionDataSubject = new Subject<LinkConnectedEvent>();

  private data: LinkConnectedEvent;

  constructor() { }

  public openConnectionDialog(data: LinkConnectedEvent) {
    this.data = data;
    this.isConnectionDialogOpenSubject.next(data.node);
  }

  public closeConnectionDialog(portId: string) {
    this.isConnectionDialogOpenSubject.next(null);
    this.data.portId = portId;
    this.linkConnectionDataSubject.next(this.data);
    this.data = null;
  }

}
