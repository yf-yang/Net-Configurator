import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { NetNodeDataModel } from '../topology/net-topology-data/net-node-data-model';
import { NotificationDialogService } from '../notification-dialog/notification-dialog.service';
import { CoreService } from '../shared/core.service';
import { EthDeviceModel } from '../topology/net-topology-data/nodes/eth-device-model';
import { SwitchModel } from '../topology/net-topology-data/nodes/switch-model';
import { DataService } from '../shared/data.service';
import { NodeDataQuery } from '../shared/interfaces/data/node-data-query';

@Injectable()
export class EditNodeDialogService {

  public isEditNodeDialogOpenSubject  = new Subject<NetNodeDataModel>();

  constructor(
    private notificationDialogService: NotificationDialogService,
    private coreService: CoreService,
    private dataService: DataService
  ) { }

  public openEditNodeDialog(node: NetNodeDataModel) {
    this.isEditNodeDialogOpenSubject.next(node);
  }

  public closeEditNodeDialog() {
    this.isEditNodeDialogOpenSubject.next(null);
  }

  public updateNode(node: NetNodeDataModel) {
    this.coreService.isWorkingSubject.next(true);

    const query: NodeDataQuery = {
      name: node.label
    };

    if (node instanceof EthDeviceModel) {
      query.IP = node.IP;
      query.MAC = node.MAC;
    } else if (node instanceof SwitchModel) {
      query.IP = node.IP;
      query.MAC = node.MAC;
    }

    this.dataService.editNode(node.id, query).subscribe(
      res => {
        this.coreService.isWorkingSubject.next(false);
      },
      error => {
        this.coreService.isWorkingSubject.next(false);
        this.notificationDialogService.openErrorModal('Failed to update the node on a server.');
      }
    );
  }

}
