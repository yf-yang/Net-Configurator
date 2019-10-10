import { Injectable, Output, EventEmitter } from '@angular/core';
import { Observable, Subject, forkJoin } from 'rxjs';

import { NetNodeDataModel } from '../topology/net-topology-data/net-node-data-model';
import { NetEdgeDataModel } from '../topology/net-topology-data/net-edge-data-model';
import { CoreService } from '../shared/core.service';
import { NotificationDialogService } from '../notification-dialog/notification-dialog.service';
import { DataService } from '../shared/data.service';
import { TopologyHighlightingService } from '../shared/topology/services/topology-highlighting.service';
import { TopologyService } from '../topology/topology.service';
import { MessageModel } from '../shared/models/messages/message-model';
import { NetTopologyDataImportService } from '../topology/net-topology-data-import/net-topology-data-import.service';
import { RouteModel } from '../shared/models/route/route-model';
import { MulticastGroupModel } from '../shared/models/messages/multicast-group-model';
import { MulticastGroupData } from '../shared/interfaces/messages/multicast-group-data';
import { MessageData } from '../shared/interfaces/message-data';

@Injectable()
export class PropertiesPanelService {

  public isOpen = false;
  public selectedItem: NetNodeDataModel | NetEdgeDataModel;
  private elementSubject = new Subject<NetNodeDataModel | NetEdgeDataModel>();

  @Output() change: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private coreService: CoreService,
    private notificationDialogService: NotificationDialogService,
    private dataService: DataService,
    private topologyHighlightingService: TopologyHighlightingService,
    private topologyService: TopologyService,
    private topologyDataImportService: NetTopologyDataImportService
  ) { }

  openPropertiesPanel(element: NetNodeDataModel | NetEdgeDataModel) {
    setTimeout(() => { this.setElement(element); }, 0);

    this.isOpen = true;
    this.change.emit(this.isOpen);
  }

  closePropertiesPanel() {
    this.selectedItem = null;
    this.isOpen = false;
    this.change.emit(this.isOpen);
  }

  setElement(element: NetNodeDataModel | NetEdgeDataModel) {
    this.selectedItem = element;
    this.elementSubject.next(element);
  }

  getElement(): Observable<NetNodeDataModel | NetEdgeDataModel> {
    return this.elementSubject.asObservable();
  }

  public addMessage(msg: MessageModel): Observable<MessageData> {
    return new Observable<MessageData>(
      observer => {
        const query = msg.extractBasicData();

        this.coreService.isWorkingSubject.next(true);
        this.dataService.addMessage(query).subscribe(
          res => {
            observer.next(res);
            this.coreService.isWorkingSubject.next(false);
            this.topologyDataImportService.setBandwidth();
            observer.complete();
          },
          error => {
            this.coreService.isWorkingSubject.next(false);
            observer.error(error);
          }
        );
      }
    );
  }

  public editMessage(msg: MessageModel) {
    const query = msg.extractBasicData();

    this.coreService.isWorkingSubject.next(true);
    this.dataService.editMessage(query, msg.id).subscribe(
      res => {
        this.coreService.isWorkingSubject.next(false);
        this.topologyDataImportService.setBandwidth();
      },
      error => {
        this.coreService.isWorkingSubject.next(false);
        this.notificationDialogService.openErrorModal('Failed to edit the message.');
      }
    );
  }

  public removeMessage(msgId: string) {
    this.dataService.removeMessage(msgId).subscribe(
      res => {
        this.coreService.isWorkingSubject.next(false);
        this.topologyDataImportService.setBandwidth();
      },
      error => {
        this.coreService.isWorkingSubject.next(false);
        this.notificationDialogService.openErrorModal('Failed to remove the message.');
      }
    );
  }

  public getRoute(msg: MessageModel): Observable<RouteModel> {
    return new Observable<RouteModel>(
      observer => {
        this.dataService.getRoute(msg.id, msg.getDestinationAddressMethod(), this.topologyService.disabledLinkId).subscribe(res => {
          if (res[0]) {
            this.topologyHighlightingService.highlightRoute(res[0]);
            observer.next(res[0]);
          }
          observer.complete();
        });
      }
    );
  }

  public removeElement(element: NetNodeDataModel, removeObs: Observable<any>[]) {
    this.coreService.isWorkingSubject.next(true);

    this.dataService.removeNode(element.id).subscribe(
      res => {
        if (removeObs.length) {

          forkJoin(removeObs).subscribe(r => {
            this.topologyService.findAndRemoveNodeFromTopology(element);
            this.topologyDataImportService.setBandwidth();

            this.coreService.isWorkingSubject.next(false);
          },
          error => {
            this.coreService.isWorkingSubject.next(false);
            this.notificationDialogService.openErrorModal('Failed to remove the node.');
          });

        } else {
          this.topologyService.findAndRemoveNodeFromTopology(element);
          this.closePropertiesPanel();
          this.topologyHighlightingService.clearSelections();
          this.coreService.isWorkingSubject.next(false);
        }
      },
      error => {
        this.coreService.isWorkingSubject.next(false);
        this.notificationDialogService.openErrorModal('Failed to remove the node.');
      }
    );

  }

  public removeLink(link: NetEdgeDataModel) {
    this.coreService.isWorkingSubject.next(true);
    this.dataService.removeLink(link.id).subscribe(
      res => {
        this.coreService.isWorkingSubject.next(false);

        if (link.disabled) {
          this.topologyService.disabledLinkId = null;
        }

        this.topologyService.findAndRemoveLinkFromTopology(link);
        this.closePropertiesPanel();
        this.topologyHighlightingService.clearSelections();
        this.topologyDataImportService.setBandwidth();
      },
      error => {
        this.coreService.isWorkingSubject.next(false);
        this.notificationDialogService.openErrorModal('Failed to remove the link.');
      }
    );
  }

  public addMulticastGroup(mg: MulticastGroupModel) {
    this.coreService.isWorkingSubject.next(true);

    const query: MulticastGroupData = {
      devices: mg.devices,
      IP: mg.IP,
      MAC: mg.MAC
    };

    this.dataService.addMulticastGroup(query).subscribe(
      res => {
        this.coreService.isWorkingSubject.next(false);
        mg.setData(res);
        this.topologyService.addMulticastGroup(mg);
      },
      error => {
        this.coreService.isWorkingSubject.next(false);
        this.notificationDialogService.openErrorModal('Failed to create the group.');
      }
    );
  }

  public removeMulticastGroup(mgId: string) {
    this.coreService.isWorkingSubject.next(true);

    this.dataService.removeMulticastGroup(mgId).subscribe(
      res => {
        this.coreService.isWorkingSubject.next(false);
        this.topologyService.getTopologyData().removeMulticastGroupById(mgId);
      },
      error => {
        this.coreService.isWorkingSubject.next(false);
        this.notificationDialogService.openErrorModal('Failed to remove the group.');
      }
    );
  }

}
