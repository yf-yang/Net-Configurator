import { Component, OnInit, OnDestroy } from '@angular/core';

import { PropertiesPanelService } from './properties-panel.service';
import { TopologyService } from '../topology/topology.service';
import { TopologyHighlightingService } from '../shared/topology/services/topology-highlighting.service';

import { NetNodeDataModel } from '../topology/net-topology-data/net-node-data-model';
import { NetEdgeDataModel } from '../topology/net-topology-data/net-edge-data-model';
import { Subscription } from 'rxjs';
import { AppService } from '../shared/app.service';
import { MessageModel } from '../shared/models/messages/message-model';
import { CoreService } from '../shared/core.service';

@Component({
  selector: 'app-properties-panel',
  templateUrl: './properties-panel.component.html',
  styleUrls: ['./properties-panel.component.scss']
})
export class PropertiesPanelComponent implements OnInit, OnDestroy {

  public element: NetNodeDataModel | NetEdgeDataModel;
  public isOpenPropertiesPanel = false;
  private elementSubscription: Subscription;
  private openSubscription: Subscription;

  constructor(
    public propertiesPanelService: PropertiesPanelService,
    public topologyService: TopologyService,
    public topologyHighlightingService: TopologyHighlightingService,
    public appService: AppService,
    public coreService: CoreService
  ) { }

  ngOnInit() {
    this.elementSubscription = this.propertiesPanelService.getElement().subscribe(element => {
      this.element = element;
    });

    this.openSubscription = this.propertiesPanelService.change.subscribe(
      (isOpen: boolean) => {
        this.isOpenPropertiesPanel = isOpen;
      }
    );

  }

  /**
   * Check if element is Node
   */
  public isNode() {
    return this.element instanceof NetNodeDataModel;
  }

  /**
   * Check if element is Link
   */
  public isLink() {
    return this.element instanceof NetEdgeDataModel;
  }

  public getMessagesDestiantionNodes(messages: MessageModel[]): NetNodeDataModel[] {
    let dstNodes: NetNodeDataModel[] = [];

    messages.forEach(m => {
      dstNodes = dstNodes.concat(m.dstNodes);
    });

    return this.coreService.getUniqueArray(dstNodes, 'id');
  }

  ngOnDestroy() {
    if (this.elementSubscription) {
      this.elementSubscription.unsubscribe();
    }

    if (this.openSubscription) {
      this.openSubscription.unsubscribe();
    }
  }

}
