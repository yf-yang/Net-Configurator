import { Component, OnInit, OnDestroy } from '@angular/core';
import { EditNodeDialogService } from './edit-node-dialog.service';

import { NetNodeDataModel } from '../topology/net-topology-data/net-node-data-model';
import { TopologyService } from '../topology/topology.service';
import { PropertiesPanelService } from '../properties-panel/properties-panel.service';
import { ValidationService } from '../shared/validation/validation.service';
import { EthDeviceModel } from '../topology/net-topology-data/nodes/eth-device-model';
import { SwitchModel } from '../topology/net-topology-data/nodes/switch-model';
import { CommonDeviceModel } from '../topology/net-topology-data/nodes/deviceNodes/common-device-model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-node-dialog',
  templateUrl: './edit-node-dialog.component.html',
  styleUrls: ['./edit-node-dialog.component.scss']
})
export class EditNodeDialogComponent implements OnInit, OnDestroy {

  public isEditNodeDialogOpen: boolean;
  public editedNode: NetNodeDataModel;
  private originalNode: NetNodeDataModel;
  private isOpenedSubscription: Subscription;

  constructor(
    public editNodeDialogService: EditNodeDialogService,
    private topologyService: TopologyService,
    private propertiesPanelService: PropertiesPanelService,
    private validationService: ValidationService) {
  }

  ngOnInit() {
    this.isOpenedSubscription = this.editNodeDialogService.isEditNodeDialogOpenSubject.subscribe(n => {
      if (n) {
        switch (n.constructor.name) {
          case 'CommonDeviceModel':
            this.editedNode = new CommonDeviceModel();
            break;
          case 'SwitchModel':
            this.editedNode = new SwitchModel();
            break;
        }

        const node = n;
        this.originalNode = node;
        this.editedNode.setData(node);
      }

      this.isEditNodeDialogOpen = n ? true : false;
    });
  }

  onSubmit() {
    this.resetEditedNodeValidation();
    this.validationService.clearItemValidation(this.originalNode);
    this.topologyService.updateNode(this.originalNode.id, this.editedNode);
    this.editNodeDialogService.closeEditNodeDialog();
    this.propertiesPanelService.setElement(this.editedNode);

    this.editNodeDialogService.updateNode(this.editedNode);
  }

  isValidIP(): boolean {
    if (this.isEditNodeDialogOpen) {

      if (this.editedNode instanceof EthDeviceModel || this.editedNode instanceof SwitchModel) {
        return this.validationService.isValidIP(this.editedNode.IP);
      } else {
        return true;
      }
    }

    return false;
  }

  isValidMAC(): boolean {
    if (this.isEditNodeDialogOpen) {

      if (this.editedNode instanceof EthDeviceModel || this.editedNode instanceof SwitchModel) {
        return this.validationService.isValidMAC(this.editedNode.MAC);
      } else {
        return true;
      }
    }

    return false;
  }

  isEmptyProp(prop: string): boolean {
    if (this.isEditNodeDialogOpen) {
      return this.validationService.isEmptyProp(this.editedNode, prop);
    }

    return false;
  }

  isValidForm(): boolean {
    return this.isValidIP() && this.isValidMAC();
  }

  private resetEditedNodeValidation() {
    if (this.editedNode.isValidationError) {
      this.editedNode.clearErrors();
      this.editedNode.setErrorStyle(false);
    }
  }

  ngOnDestroy() {
    if (this.isOpenedSubscription) {
      this.isOpenedSubscription.unsubscribe();
    }
  }
}
