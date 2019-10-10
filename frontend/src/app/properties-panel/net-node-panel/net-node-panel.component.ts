import { Component, OnInit, Input } from '@angular/core';

import { EditNodeDialogService } from '../../edit-node-dialog/edit-node-dialog.service';
import { PropertiesPanelService } from '../properties-panel.service';
import { TopologyService } from '../../topology/topology.service';
import { TopologyHighlightingService } from '../../shared/topology/services/topology-highlighting.service';

import { NetNodeDataModel } from '../../topology/net-topology-data/net-node-data-model';
import { SwitchModel } from 'src/app/topology/net-topology-data/nodes/switch-model';
import { EthDeviceModel } from '../../topology/net-topology-data/nodes/eth-device-model';

@Component({
  selector: 'app-net-node-panel',
  templateUrl: './net-node-panel.component.html',
  styleUrls: ['./net-node-panel.component.scss']
})
export class NetNodePanelComponent implements OnInit {

  @Input() element: NetNodeDataModel;

  constructor(
    public editNodeDialogService: EditNodeDialogService,
    public propertiesPanelService: PropertiesPanelService,
    public topologyService: TopologyService,
    public topologyHighlightingService: TopologyHighlightingService
  ) { }

  ngOnInit() {
  }

  public isSwitchOrRouter(): boolean {
    return this.element instanceof SwitchModel;
  }

  public isEthDevice(): boolean {
    return this.element instanceof EthDeviceModel;
  }
}
