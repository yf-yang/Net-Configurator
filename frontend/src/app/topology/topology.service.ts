import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { NetTopologyDataModel } from '../topology/net-topology-data/net-topology-data-model';
import { NetNodeDataModel } from '../topology/net-topology-data/net-node-data-model';
import { NetEdgeDataModel } from '../topology/net-topology-data/net-edge-data-model';

import { CoreService } from '../shared/core.service';
import { SvgTransform } from '../shared/topology/interfaces/svg-transform';
import { DragItemModel } from '../shared/models/drag-item-model';
import { Point } from '../shared/models/point';
import { SwitchModel } from './net-topology-data/nodes/switch-model';
import { EdgeData } from '../shared/topology/interfaces/edge-data';
import { MulticastGroupModel } from '../shared/models/messages/multicast-group-model';

@Injectable()
export class TopologyService {

  public saveTopologySubject: Subject<boolean> = new Subject<boolean>();
  public updateLayoutSubject: Subject<boolean> = new Subject<boolean>();
  public disabledLinkId: string;
  private topologyDataSubject: Subject<NetTopologyDataModel> = new Subject<NetTopologyDataModel>();
  private topologyData: NetTopologyDataModel = new NetTopologyDataModel();
  private topologyTransform: SvgTransform;

  constructor(
    private coreService: CoreService
  ) { }

  public setTopologyData(topologyData: NetTopologyDataModel) {
    this.topologyData = topologyData;
    this.updateTopology();
  }

  public updateLayout() {
    this.updateLayoutSubject.next(true);
  }

  public setTopologyTransform(transform: SvgTransform) {
    this.topologyTransform = transform;
  }

  public getTopologyTransform(): SvgTransform {
    return this.topologyTransform;
  }

  /**
   * Append new nodes into topologyData.netNodes array
   */
  public appendNodes(nodes: NetNodeDataModel[]): void {
    this.topologyData.netNodes = this.topologyData.netNodes.concat(nodes);
  }

  /**
   * Append new links into topologyData.netLinks array
   */
  public appendLinks(links: NetEdgeDataModel[]): void {
    this.topologyData.netLinks = this.topologyData.netLinks.concat(links);
  }

  public addMulticastGroup(mg: MulticastGroupModel) {
    this.topologyData.multicastGroups.push(mg);
  }

  /**
   * Get topologyData observable. Use, when you need to listen on data changes.
   */
  public getTopologyDataObservable(): Observable<NetTopologyDataModel> {
    return this.topologyDataSubject.asObservable();
  }

  /**
   * Get topologyData object. Use when you need actual data.
   */
  public getTopologyData(): NetTopologyDataModel {
    return this.topologyData;
  }

  /**
   * Find node in nodesArray and remove it
   */
  public findAndRemoveNodeFromTopology(node: NetNodeDataModel, removeLinks: boolean = true) {
    this.topologyData.removeNetNodeByNode(node);

    if (removeLinks) {
      this.findAndRemoveLinksByNodeId(node.id);
    }
  }

  /**
   * Find links attached to particular node and remove them from topology
   */
  public findAndRemoveLinksByNodeId(nodeId: string) {
    this.topologyData.removeNetLinksByNodeId(nodeId);
    this.updateTopology();
  }

  /**
   * Find link in linkArray and remove it
   */
  public findAndRemoveLinkFromTopology(link: NetEdgeDataModel) {
    this.topologyData.removeNetLinkByLink(link);

    if (link.fromNodeObj.type === 'link-drag-from') {
      this.findAndRemoveNodeFromTopology(link.fromNodeObj);
    }

    if (link.toNodeObj.type === 'link-drag-to') {
      this.findAndRemoveNodeFromTopology(link.toNodeObj);
    }

    // Remove link from switch port
    if (link.fromNodeObj instanceof SwitchModel && link.fromNodeObj.ports.length) {
      link.fromNodeObj.disconnectLink(link.id);
    }

    if (link.toNodeObj instanceof SwitchModel && link.toNodeObj.ports.length) {
      link.toNodeObj.disconnectLink(link.id);
    }

    this.updateTopology();
  }

  /**
   * Reset topologyData and clean topology of all nodes, links
   */
  public clearTopology() {
    this.topologyData = new NetTopologyDataModel();
    this.disabledLinkId = null;
    this.updateTopology();
  }

  /**
   * Update node property values
   */
  public updateNode(originalNodeId: string, node: NetNodeDataModel): void {
    // find index of edited node
    const originalNode: NetNodeDataModel = this.topologyData.getNetNodeById(originalNodeId);

    if (originalNode != null) {
      // set new data to found node
      originalNode.setData(node);

      // fire topologyData change, on which renderTopology method is listening
      this.updateTopology();
    }
  }

  public updateTopology() {
    this.topologyDataSubject.next(this.topologyData);
  }

  public getNewNodePosition(dropEvent: DragEvent, droppedItem: DragItemModel, transform: SvgTransform): Point {
    const offsetX = dropEvent.offsetX - (droppedItem.cursorOffsetX * transform.scale[0]);
    const offsetY = dropEvent.offsetY - (droppedItem.cursorOffsetY * transform.scale[0]);

    return {
      x: (offsetX - transform.translate[0]) / transform.scale[0],
      y: (offsetY - transform.translate[1]) / transform.scale[0]
    };
  }

}
