import { Component, OnInit, Input, SimpleChanges, OnChanges, OnDestroy } from '@angular/core';
import { EthDeviceModel } from '../../../../topology/net-topology-data/nodes/eth-device-model';
import { MessageModel } from '../../../../shared/models/messages/message-model';
import { EditNodeDialogService } from '../../../../edit-node-dialog/edit-node-dialog.service';
import { PropertiesPanelService } from '../../../properties-panel.service';
import { TopologyService } from '../../../../topology/topology.service';
import { TopologyHighlightingService } from '../../../../shared/topology/services/topology-highlighting.service';
import { NetNodeDataModel } from '../../../../topology/net-topology-data/net-node-data-model';
import { NetNodePanel } from '../../net-node-panel';
import { DataService } from '../../../../shared/data.service';
import { Subscription } from 'rxjs';
import { NotificationDialogService } from '../../../../notification-dialog/notification-dialog.service';
import { IpMessageModel } from '../../../../shared/models/messages/ip-message-model';
import { RouteModel } from '../../../../shared/models/route/route-model';
import { CoreService } from '../../../../shared/core.service';

@Component({
  selector: 'app-eth-node-panel',
  templateUrl: './eth-node-panel.component.html',
  styleUrls: [
    './eth-node-panel.component.scss',
    '../../net-node-panel.component.scss',
    '../../../properties-panel.component.scss'
  ]
})
export class EthNodePanelComponent extends NetNodePanel implements OnInit, OnChanges, OnDestroy {

  @Input() element: EthDeviceModel;

  public selectedMessages: MessageModel[];
  public messagesDestinations: NetNodeDataModel[];
  public dstIpMessages: IpMessageModel[];
  public routes: {
    [prop: string]: RouteModel
  };
  private msgAddSubscription: Subscription;
  private routeSubscription: Subscription;

  constructor(
    public editNodeDialogService: EditNodeDialogService,
    public propertiesPanelService: PropertiesPanelService,
    public topologyService: TopologyService,
    public topologyHighlightingService: TopologyHighlightingService,
    private dataService: DataService,
    private notificationDialogService: NotificationDialogService,
    public coreService: CoreService
  ) {
    super(
      propertiesPanelService,
      editNodeDialogService,
      topologyHighlightingService,
      topologyService,
      coreService
    );
  }

  ngOnInit() {
    this.initSelectedObjects();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.initSelectedObjects();
    this.dstIpMessages = this.topologyService.getTopologyData().getIpMessagesByDst(this.element);
  }

  private initSelectedObjects() {
    this.selectedMessages = [];
    this.messagesDestinations = [];
    this.routes = {};
    this.topologyHighlightingService.clearHighlightedPath();
  }

  public onMessageClick() {
    console.log(this.selectedMessages);
    if (this.selectedMessages.length === 0) {
      this.initSelectedObjects();
      return;
    }

    this.topologyHighlightingService.clearHighlightedPath();

    this.selectedMessages.forEach(msg => {
      this.routeSubscription = this.propertiesPanelService.getRoute(msg).subscribe(res => {
        this.routes[msg.id] = res;
      });
    });

    this.messagesDestinations = this.getMessagesDestiantionNodes(this.selectedMessages);
  }

  public onMessageEdited() {
    this.propertiesPanelService.editMessage(this.selectedMessages[0]);

    this.initSelectedObjects();
    this.topologyHighlightingService.clearHighlightedPath();
  }

  public onMessageRemoved() {
    this.propertiesPanelService.removeMessage(this.selectedMessages[0].id);

    this.initSelectedObjects();
    this.topologyHighlightingService.clearHighlightedPath();
  }

  public onMessageAdded(msg: MessageModel) {
    this.msgAddSubscription = this.propertiesPanelService.addMessage(msg).subscribe(
      data => msg.setData(data),
      error => this.notificationDialogService.openErrorModal('Failed to create the message.')
    );
  }

  public removeElement() {
    const linksId = this.topologyService.getTopologyData().getNetLinksByNode(this.element).filter(l => l.isConnected()).map(l => l.id);
    const removeLinkObs = linksId.map(id => this.dataService.removeLink(id));
    const removeIpMsgs = this.element.ipMessages.map(m => this.dataService.removeMessage(m.id));

    const removeObs = removeLinkObs.concat(removeIpMsgs);

    this.propertiesPanelService.removeElement(this.element, removeObs);

    this.closePanel();
  }

  public openEditNodeDialog(element: NetNodeDataModel) {
    this.editNodeDialogService.openEditNodeDialog(element);
  }

  public isSingleMessage(): boolean {
    return this.selectedMessages.length === 1;
  }

  public getSelectedBw(): number {
    let bw = 0;
    this.selectedMessages.forEach(msg => {
      bw += msg.bandwidth;
    });

    return bw;
  }

  public getTotalBw(messages: MessageModel[]): number {
    let bw = 0;

    messages.forEach(msg => {
      bw += msg.bandwidth;
    });

    return bw;
  }

  ngOnDestroy() {
    if (this.msgAddSubscription) {
      this.msgAddSubscription.unsubscribe();
    }

    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

}
