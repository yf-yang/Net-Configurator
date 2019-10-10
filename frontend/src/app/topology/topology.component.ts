import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';

import { PropertiesPanelService } from '../properties-panel/properties-panel.service';
import { TopologyHighlightingService } from '../shared/topology/services/topology-highlighting.service';
import { NetTopologyDataImportService } from './net-topology-data-import/net-topology-data-import.service';
import { TopologyService } from './topology.service';
import { DragAndDropService } from '../shared/common/drag-and-drop.service';

import { NetEdgeDataModel } from './net-topology-data/net-edge-data-model';
import { NetNodeDataModel } from './net-topology-data/net-node-data-model';

import { NodeClickEvent } from '../shared/topology/interfaces/events/node-click-event';
import { LinkClickEvent } from '../shared/topology/interfaces/events/link-click-event';
import { SvgTransform } from '../shared/topology/interfaces/svg-transform';
import { LinkConnectedEvent } from '../shared/topology/interfaces/events/link-connected-event';
import { LinkControlNodeModel } from './net-topology-data/nodes/link-control-node-model';
import { LinkConnectionDialogService } from '../link-connection-dialog/link-connection-dialog.service';
import { DataService } from '../shared/data.service';
import { LinkDataQuery } from '../shared/interfaces/data/link-data-query';
import { CoreService } from '../shared/core.service';
import { NotificationDialogService } from '../notification-dialog/notification-dialog.service';
import { AppService } from '../shared/app.service';

@Component({
  selector: 'app-topology',
  templateUrl: './topology.component.html',
  styleUrls: ['./topology.component.scss']
})

export class TopologyComponent implements OnInit, OnDestroy {

  @ViewChild('panel') panel: ElementRef;

  public isOpenPropertiesPanel = false;
  public isLoading = false;
  public isDragging = false;

  public panelWidthStr: string;
  public panelWidth: number;
  public rightPosition: string;
  private startPosition: number;

  private subscriptions: Subscription;

  constructor(
    private propertiesPanelService: PropertiesPanelService,
    private topologyHighlightingService: TopologyHighlightingService,
    private topologyDataImportService: NetTopologyDataImportService,
    private topologyService: TopologyService,
    private dragAndDropService: DragAndDropService,
    private linkConnectionDialogService: LinkConnectionDialogService,
    private dataService: DataService,
    private coreService: CoreService,
    private notificationService: NotificationDialogService,
    private appService: AppService,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.panelWidthStr = 'auto';
    this.panelWidth = 540;
    this.rightPosition = '-540px';

    this.subscriptions = new Subscription();

    this.subscriptions.add(
      this.propertiesPanelService.change.subscribe(
        (isOpen: boolean) => {
          this.isOpenPropertiesPanel = isOpen;
          this.setPositionFromRight();
        }
      )
    );

    this.subscriptions.add(
      this.topologyDataImportService.isLoadingSubject.subscribe(
        value => this.isLoading = value
      )
    );

    this.subscriptions.add(
      this.dragAndDropService.isDraggingSubject.subscribe(
        value => this.isDragging = value
      )
    );

    this.subscriptions.add(
      this.linkConnectionDialogService.linkConnectionDataSubject.subscribe(
        data => {
          if (data) {
            this.onLinkConnected(data);
          }
        }
      )
    );

    this.subscriptions.add(
      this.appService.mouseSubject.subscribe(e => {
        this.resizePanel(e);
      })
    );

    this.topologyService.setTopologyTransform({
      translate: [0, 0],
      scale: [1]
    });
  }

    /**
   * Method called when item is dragged and dropped from toolbar
   */
  public dropItem(e: DragEvent) {
    e.preventDefault();

    const droppedItem = this.dragAndDropService.getDraggedItem();

    if (!droppedItem) {
      return;
    }

    const position = this.topologyService.getNewNodePosition(e, droppedItem, this.topologyService.getTopologyTransform());

    this.subscriptions.add(droppedItem.createTopologyItem(position).subscribe(
      addedItems => {
        this.topologyService.appendNodes(addedItems.netNodes);
        this.topologyService.appendLinks(addedItems.netLinks);

        this.topologyService.updateTopology();
      },
      error => {
        this.notificationService.openErrorModal('Failed to create the node.');
      })
    );
  }

  public onNodeClicked(data: NodeClickEvent) {
    this.topologyHighlightingService.clearSelections();
    this.propertiesPanelService.closePropertiesPanel();
    this.changeDetector.detectChanges();

    if (!this.isItemSelected(data.netNode)) {
      this.propertiesPanelService.openPropertiesPanel(data.netNode);
      this.topologyHighlightingService.selectNode(data.netNode, true);
    }

    console.log(data.netNode);
  }

  public onLinkClicked(data: LinkClickEvent) {
    this.topologyHighlightingService.clearSelections();
    this.propertiesPanelService.closePropertiesPanel();
    this.changeDetector.detectChanges();

    if (!this.isItemSelected(data.netLink)) {
      this.propertiesPanelService.openPropertiesPanel(data.netLink);
      this.topologyHighlightingService.selectLink(data.netLink);
    }

    console.log(data.netLink);
  }

  public onSvgClicked(isClicked: boolean) {
    if (isClicked) {
      this.propertiesPanelService.closePropertiesPanel();
      this.topologyHighlightingService.clearSelections();
    }
  }

  public onTransform(transform: SvgTransform) {
    this.topologyService.setTopologyTransform(transform);
  }

  public onLinkConnected(data: LinkConnectedEvent) {
    if (data.link) {
      if (!data.portId) {
        if (data.node.ports.length > 1) {
          this.linkConnectionDialogService.openConnectionDialog(data);
          return;
        } else {
          data.node.connectLinkToPort(data.link, data.node.ports[0].id);
        }
      } else {
        data.node.connectLinkToPort(data.link, data.portId);
      }

      let nodeToUpdate: NetNodeDataModel;

      if (data.controlNode.type === 'link-drag-from') {
        data.link.from = data.node.id;
        data.link.fromNodeObj = data.node;
        nodeToUpdate = data.link.toNodeObj;
      } else {
        data.link.to = data.node.id;
        data.link.toNodeObj = data.node;
        nodeToUpdate = data.link.fromNodeObj;
      }

      this.updateNeighbor(nodeToUpdate, data.node, data.link);
      data.link.setLinkColor();

      this.topologyService.findAndRemoveNodeFromTopology(data.controlNode, false);

      if (!(data.link.fromNodeObj instanceof LinkControlNodeModel || data.link.toNodeObj instanceof LinkControlNodeModel)) {
        data.link.setDashed(false);
        data.link.setClickable(true);

        let nodeToSet: NetNodeDataModel;

        if (data.node.id === data.link.fromNodeObj.id) {
          nodeToSet = data.link.toNodeObj;
        } else {
          nodeToSet = data.link.fromNodeObj;
        }

        data.node.setPortNode(data.link, nodeToSet);

        const linkQuery: LinkDataQuery[] = [
          {
            node: data.link.fromNodeObj.id,
            port: data.link.fromNodeObj.getPortByLinkId(data.link.id).id
          },
          {
            node: data.link.toNodeObj.id,
            port: data.link.toNodeObj.getPortByLinkId(data.link.id).id
          }
        ];

        this.coreService.isWorkingSubject.next(true);
        this.dataService.createLink(linkQuery).subscribe(
          res => {
            data.link.id = res[0].id;
            data.link.setSpeed(res[0].bandwidth);

            data.link.setPorts(data.link.fromNodeObj, data.link.toNodeObj, data.link.id);
            this.coreService.isWorkingSubject.next(false);
            this.topologyDataImportService.setBandwidth();
            this.topologyService.updateTopology();
          },
          error => {
            this.coreService.isWorkingSubject.next(false);
            this.topologyService.findAndRemoveLinkFromTopology(data.link);
            this.topologyService.updateTopology();
            this.notificationService.openErrorModal('Failed to create the link.');
          }
        );
      } else {
        this.topologyService.updateTopology();
      }
    }
  }

  public allowPanelResize(e: MouseEvent) {
    this.appService.allowPropPanelResize = true;
    this.initDragPosition(e);
  }

  public setPositionFromRight() {
    setTimeout(() => {
      this.panelWidth = this.panel.nativeElement.offsetWidth;
      this.rightPosition = -this.panel.nativeElement.offsetWidth + 'px';
    }, 200);
  }

  private resizePanel(e: MouseEvent) {
    this.panelWidthStr = this.startPosition - e.pageX + 'px';
  }

  private initDragPosition(e: MouseEvent) {
    const panelWidth = this.panel.nativeElement.offsetWidth;
    this.startPosition = e.pageX + panelWidth;
  }

  private updateNeighbor(nodeToUpdate: NetNodeDataModel, node: NetNodeDataModel, link: NetEdgeDataModel) {
    if (nodeToUpdate.type === 'topology-item') {
      nodeToUpdate.getPortByLinkId(link.id).setConnectedNodeData(node);
    }
  }

  private isItemSelected(item: NetNodeDataModel | NetEdgeDataModel): boolean {
    if (this.propertiesPanelService.selectedItem === item && this.propertiesPanelService.isOpen === true) {
      this.propertiesPanelService.closePropertiesPanel();
      return true;
    } else {
      return false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

}
