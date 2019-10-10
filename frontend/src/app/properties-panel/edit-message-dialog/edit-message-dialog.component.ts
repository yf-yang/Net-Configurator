import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { EditPropertiesDialogComponent } from '../edit-properties-dialog/edit-properties-dialog.component';

import { ValidationService } from '../../shared/validation/validation.service';
import { NetNodeDataModel } from '../../topology/net-topology-data/net-node-data-model';
import { TopologyService } from '../../topology/topology.service';
import { IpMessageModel } from '../../shared/models/messages/ip-message-model';
import { MulticastGroupModel } from '../../shared/models/messages/multicast-group-model';
import { MessageDestination } from '../../shared/interfaces/messages/message-destination';
import { ClrWizard, ClrWizardPage } from '@clr/angular';
import { PropertiesPanelService } from '../properties-panel.service';
import { IpMessageDestination } from '../../shared/interfaces/messages/ip/ip-message-destination';

@Component({
  selector: 'app-edit-message-dialog',
  templateUrl: './edit-message-dialog.component.html',
  styleUrls: ['./edit-message-dialog.component.scss']
})
export class EditMessageDialogComponent extends EditPropertiesDialogComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  nodeId: string;

  @Input()
  item: IpMessageModel;

  @Input()
  itemsArray: [IpMessageModel];

  @Output()
  itemRemoved = new EventEmitter();

  @ViewChild('wizard') wizard: ClrWizard;
  @ViewChild('mgCrudPage') mgCrudPage: ClrWizardPage;
  @ViewChild('mgPage') mgPage: ClrWizardPage;

  public originalItemId: string;
  public nodes: NetNodeDataModel[];
  public selectedNode: NetNodeDataModel;
  public selectedNodes: NetNodeDataModel[];
  public port: number;
  public addressMethod: 'UNICAST' | 'MULTICAST';
  public multicastGroups: MulticastGroupModel[];
  public selectedMGroup: MulticastGroupModel;
  public shownMGroupTab: boolean;
  public mgNodes: NetNodeDataModel[];
  public multicastGroupItem: MulticastGroupModel;
  public mgItems: NetNodeDataModel[];

  constructor(
    private validationService: ValidationService,
    private topologyService: TopologyService,
    private propertiesPanelService: PropertiesPanelService
  ) {
    super();
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.item && !changes.item.currentValue) {
      this.initMessage();
    }

    const devices = this.topologyService.getTopologyData().getAllDevices();
    devices.splice(devices.findIndex(device => device.id === this.nodeId), 1);

    this.nodes = devices;

    this.multicastGroups = this.topologyService.getTopologyData().multicastGroups;
    this.shownMGroupTab = false;
  }

  setItem(value: string, item?: IpMessageModel) {
    if (value === 'new') {
      this.initMessage();
    } else {
      this.originalItemId = item.id;
      this.item = item.copyObject();

      const dstNodeId = this.item.getDestinationIds();
      this.selectedNode = this.topologyService.getTopologyData().getNetNodeById(dstNodeId[0]);

      if (this.item instanceof IpMessageModel) {
        this.port = this.item.destination.port;
      }

      this.addressMethod = this.item.getDestinationAddressMethod();
    }
  }

  // TODO: move to abstract class?
  removeItem(item?: IpMessageModel) {
    this.itemsArray.splice(this.itemsArray.findIndex(n => n.id === item.id), 1);
    this.itemRemoved.emit();
  }

  isValidPort(port: number): boolean {
    if (this.item) {
      const portStr = port + '';
      return this.validationService.isValidPort(portStr);
    }

    return false;
  }

  isEmptyProp(prop: string): boolean {
    if (this.item) {
      return this.validationService.isEmptyProp(this.item, prop);
    }

    return false;
  }

  isValidForm(): boolean {
    return this.item.name && this.selectedNode !== null;
  }

  isPropertyError(property: string): boolean {
    return this.item.errorsObj.filter(
      err => err.property === property
    ).length > 0;
  }

  public addMessage() {
    const node = this.topologyService.getTopologyData().getNetNodeById(this.nodeId);
    this.item.setSource(node);

    let dstData: IpMessageDestination = {
      address_method: this.addressMethod,
      port: this.port,
      nodes: this.selectedNode ? [this.selectedNode] : this.mgNodes
    };

    if (this.selectedMGroup) {
      dstData = Object.assign({
        multicast_group: this.selectedMGroup.id
      }, dstData);
    }

    this.item.setDestination(dstData);
    this.addItem();
  }

  public isUnicast(): boolean {
    return this.addressMethod === 'UNICAST';
  }

  public showAddMGroupTab(state: boolean) {
    this.shownMGroupTab = state;

    if (state) {
      this.initMulticastGroup();
      setTimeout(() => {
        this.wizard.navService.currentPage = this.mgCrudPage;
      }, 100);
    } else {
      this.wizard.navService.currentPage = this.mgPage;
    }
  }

  public mgChanged() {
    if (this.selectedMGroup) {
      this.mgNodes = this.selectedMGroup.devices.map(id => this.topologyService.getTopologyData().getNetNodeById(id));
    } else {
      this.mgNodes = [];
    }
  }

  public mgCustomBtnClick(buttonType: string) {
    if (buttonType === 'custom-next') {
      this.showAddMGroupTab(false);
      this.multicastGroupItem.devices = this.mgItems.map(node => node.id);
      this.propertiesPanelService.addMulticastGroup(this.multicastGroupItem);
    } else if (buttonType === 'custom-previous') {
      this.showAddMGroupTab(false);
    }
  }

  public removeMulticastGroup() {
    this.propertiesPanelService.removeMulticastGroup(this.selectedMGroup.id);
    this.selectedMGroup = null;
  }

  private initMulticastGroup() {
    this.multicastGroupItem = new MulticastGroupModel();
    this.mgItems = [];
  }

  private initMessage() {
    this.item = new IpMessageModel();
    this.port = 0;
    this.selectedNode = null;
    this.selectedNodes = [];
    this.addressMethod = 'UNICAST';
  }

  ngOnDestroy() {
    this.selectedNode = null;
  }

}
