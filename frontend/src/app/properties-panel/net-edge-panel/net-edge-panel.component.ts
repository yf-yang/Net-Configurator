import { Component, OnInit, Input, OnChanges, OnDestroy } from '@angular/core';
import { PropertiesPanelComponent } from '../properties-panel.component';
import { PropertiesPanelService } from '../properties-panel.service';
import { TopologyService } from '../../topology/topology.service';
import { TopologyHighlightingService } from '../../shared/topology/services/topology-highlighting.service';
import { NetEdgeDataModel } from '../../topology/net-topology-data/net-edge-data-model';
import { NetTopologyDataImportService } from '../../topology/net-topology-data-import/net-topology-data-import.service';
import { ClrDatagridSortOrder } from '@clr/angular';
import { AppService } from '../../shared/app.service';
import { RouteModel } from '../../shared/models/route/route-model';
import { Subscription } from 'rxjs';
import { BwTrafficData } from '../../shared/interfaces/bandwidth/bw-traffic-data';
import { BwDataModel } from '../../shared/models/bandwidth/bw-data-model';
import { NetNodeDataModel } from '../../topology/net-topology-data/net-node-data-model';
import { CoreService } from '../../shared/core.service';

@Component({
  selector: 'app-net-edge-panel',
  templateUrl: './net-edge-panel.component.html',
  styleUrls: [
    '../properties-panel.component.scss',
    './net-edge-panel.component.scss'
  ]
})
export class NetEdgePanelComponent extends PropertiesPanelComponent implements OnInit, OnChanges, OnDestroy {

  @Input() element: NetEdgeDataModel;

  public descSort = ClrDatagridSortOrder.DESC;
  public selectedTraffics: BwTrafficData[];
  public messagesDestinations: NetNodeDataModel[];
  public routes: {
    [prop: string]: RouteModel
  };
  private routeSubscription: Subscription;

  constructor(
    public propertiesPanelService: PropertiesPanelService,
    public topologyService: TopologyService,
    public topologyHighlightingService: TopologyHighlightingService,
    public appService: AppService,
    private topologyDataImportService: NetTopologyDataImportService,
    public coreService: CoreService
  ) {
    super(
      propertiesPanelService,
      topologyService,
      topologyHighlightingService,
      appService,
      coreService
    );
  }

  ngOnInit() {
    this.initSelectedObjects();
  }

  ngOnChanges() {
    this.initSelectedObjects();
  }

  public removeElement() {
    this.propertiesPanelService.removeLink(this.element);
  }

  public disableLink() {
    this.topologyHighlightingService.clearErrorLinks();

    if (this.element.disabled) {
      this.element.disabled = false;
      this.topologyService.disabledLinkId = null;
    } else {
      this.topologyService.getTopologyData().netLinks.forEach(l => l.disabled = false);
      this.element.disable();
      this.topologyService.disabledLinkId = this.element.id;
    }

    this.topologyDataImportService.setBandwidth();
    this.topologyService.updateTopology();
  }

  public getUtilisation(bw: number): number {
    return Math.round((bw / this.element.speed * 100) * 100) / 100;
  }

  public onMessageHover(srcNodeId: string, dstNodeIds: string[], route?: RouteModel) {
    this.topologyHighlightingService.highlightNode(srcNodeId);
    dstNodeIds.forEach(dstNodeId => this.topologyHighlightingService.highlightNode(dstNodeId));
  }

  public onMessageOut() {
    this.topologyHighlightingService.clearHighlightedNodes();
  }

  public onMessageClick() {
    console.log(this.selectedTraffics);
    if (this.selectedTraffics.length === 0) {
      this.initSelectedObjects();
      return;
    }

    this.topologyHighlightingService.clearHighlightedPath();

    this.selectedTraffics.forEach(t => {
      this.routeSubscription = this.propertiesPanelService.getRoute(t.message).subscribe(res => {
        this.routes[t.message.id] = res;
      });
    });

    let messages = [];
    this.selectedTraffics.forEach(t => {
      messages = messages.concat(t.message);
    });

    this.messagesDestinations = this.getMessagesDestiantionNodes(messages);
  }

  public getSelectedBw(): number {
    let bw = 0;
    this.selectedTraffics.forEach(msg => {
      bw += msg.bandwidth;
    });

    return bw;
  }

  public getTotalBw(bwData: BwDataModel): number {
    let bw = 0;
    bwData.traffic.forEach(t => {
      bw += t.bandwidth;
    });

    return bw;
  }

  private initSelectedObjects() {
    this.selectedTraffics = [];
    this.routes = {};
    this.topologyHighlightingService.clearHighlightedPath();
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}
