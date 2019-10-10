import { PropertiesPanelService } from '../properties-panel.service';
import { NetNodeDataModel } from '../../topology/net-topology-data/net-node-data-model';
import { EditNodeDialogService } from '../../edit-node-dialog/edit-node-dialog.service';
import { Input } from '@angular/core';
import { TopologyHighlightingService } from '../../shared/topology/services/topology-highlighting.service';
import { TopologyService } from '../../topology/topology.service';
import { RouteModel } from '../../shared/models/route/route-model';
import { MessageModel } from '../../shared/models/messages/message-model';
import { CoreService } from '../../shared/core.service';

export abstract class NetNodePanel {

  @Input() element: NetNodeDataModel;

  constructor(
    public propertiesPanelService: PropertiesPanelService,
    public editNodeDialogService: EditNodeDialogService,
    public topologyHighlightingService: TopologyHighlightingService,
    public topologyService: TopologyService,
    public coreService: CoreService
  ) {}

  abstract removeElement(): void;

  public openEditNodeDialog(element: NetNodeDataModel) {
    this.editNodeDialogService.openEditNodeDialog(element);
  }

  public getIcon(icon: string): string {
    const str = icon.split('-error');
    return str[0] + str[1];
  }

  public closePanel() {
    this.propertiesPanelService.closePropertiesPanel();
    this.topologyHighlightingService.clearSelections();
  }

  public isDEVICE(icon: string): boolean {
    return icon.indexOf('device') !== -1;
  }

  public onPortHover(nodeId: string, linkId: string) {
    if (nodeId && linkId) {
      this.topologyHighlightingService.highlightPort(linkId, nodeId);
    }
  }

  public onPortOut() {
    this.topologyHighlightingService.clearHighlightedItems();
  }

  public onPortsEdited() {

  }

  public onMessageHover(nodeIds: string[], route?: RouteModel) {
    nodeIds.forEach(nodeId => this.topologyHighlightingService.highlightNode(nodeId));
  }

  public onMessageOut() {
    this.topologyHighlightingService.clearHighlightedNodes();
  }

  public getMessagesDestiantionNodes(messages: MessageModel[]): NetNodeDataModel[] {
    let dstNodes: NetNodeDataModel[] = [];

    messages.forEach(m => {
      dstNodes = dstNodes.concat(m.dstNodes);
    });

    return this.coreService.getUniqueArray(dstNodes, 'id');
  }
}
