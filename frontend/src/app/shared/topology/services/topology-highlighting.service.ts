import { Injectable } from '@angular/core';

import { TopologyService } from '../../../topology/topology.service';
import { TopologyVizService } from '../../../topology-viz/topology-viz.service';

import { NetNodeDataModel } from '../../../topology/net-topology-data/net-node-data-model';
import { NetEdgeDataModel } from '../../../topology/net-topology-data/net-edge-data-model';

import * as d3 from 'd3';
import { SwitchModel } from 'src/app/topology/net-topology-data/nodes/switch-model';
import { RouteModel } from '../../models/route/route-model';

@Injectable()
export class TopologyHighlightingService {

  constructor(
    private topologyService: TopologyService,
    private topologyVizService: TopologyVizService
  ) { }

  /**
   * Higlight path of signal
   */
  public highlighSignalPath(nodeFrom: NetNodeDataModel, nodeTo: NetNodeDataModel): void {
    this.highlightNode(nodeFrom.id);
    this.highlightNode(nodeTo.id);

    if (nodeFrom && nodeTo) {

      const path = this.getSignalPath(nodeFrom, nodeTo);
      path.forEach((item, index) => {
        if (index < path.length - 1) {
          if (item.id === '0x0F') {
            this.highlightNode(item.id);
          }
            this.highlightNode(item.id);
            this.highlightPathBetweenNodes(item, path[index + 1]);
            this.highlightNode(path[index + 1].id);
        }
      });

    }
  }

  public highlightRoute(route: RouteModel) {
    route.links.forEach(linkData => {
      this.highlightPathNode(linkData.from);
      this.highlightPathNode(linkData.to);
      this.highlightPathLink(linkData.link);
    });
  }

  public highlightSelectedRoute(route: RouteModel) {
    route.links.forEach(linkData => {
      this.highlightSelectedPathLink(linkData.link);
    });
  }

  public highlightErrorLink(linkId: string) {
    d3.select('#link' + linkId)
      .classed('error-link', true);
  }

  public clearErrorLinks() {
    d3.selectAll('.error-link')
      .classed('error-link', false);
  }

  /**
   * Clears selections of nodes and links from SVG, sets opacity to 1
   */
  public clearSelections(): void {
    this.setTopologyOpacity(1);
    const svg = this.topologyVizService.getSvgObject();

    this.clearHighlightedItems();
    this.clearHighlightedPath();

    svg.selectAll('.selected-node')
      .classed('selected-node', false);

    svg.selectAll('.selected-link')
      .classed('selected-link', false);

    svg.selectAll('.pathSelection')
      .remove();
  }

  public clearHighlightedPath() {
    const svg = this.topologyVizService.getSvgObject();

    svg.selectAll('.path-node')
      .classed('path-node', false);

    svg.selectAll('.path-link')
      .classed('path-link', false);
  }

  public clearHighlightedItems() {
    this.clearHighlightedLinks();
    this.clearHighlightedNodes();
  }

  public clearHighlightedNodes() {
    d3.selectAll('.highlighted-node')
      .classed('highlighted-node', false);
  }

  public clearHighlightedLinks() {
    d3.selectAll('.highlighted-link')
      .classed('highlighted-link', false);
  }

  /**
   * Sets opacity of links and nodes to desired number
   */
  public setTopologyOpacity(opacity: number) {
    const svg = this.topologyVizService.getSvgObject();

    svg.select('.links')
      .selectAll('.link')
      .attr('opacity', opacity);

    svg.select('.nodes')
      .selectAll('.node')
      .attr('opacity', opacity);
  }

  public clearHighlightedNode(nodeId: string) {
    const svg = this.topologyVizService.getSvgObject();
    svg.select('#node' + nodeId).classed('selected-node', false);
  }

  public highlightPort(linkId: string, nodeId?: string) {
    this.highlightLink(linkId);

    if (nodeId) {
      this.highlightNode(nodeId);
    }
  }

  public selectNode(node: NetNodeDataModel, first?: boolean): void {
    this.setTopologyOpacity(0.5);

    const color = first ? '#FFFFFF' : '#0071AF';
    const width = first ? '2px' : '2px';

    if (node) {
      const selection = d3.select('#node' + node.id)
        .classed('selected-node', true);

      if (!(node instanceof SwitchModel)) {
        selection.append<SVGCircleElement>('circle')
          .attr('class', 'pathSelection')
          .attr('cx', () => node.iconWidth / 2)
          .attr('cy', () => node.iconHeight / 2)
          .attr('r', node.iconWidth  / 2)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', width);
      }
    }
  }

  public highlightNode(nodeId: string): void {
    d3.select('#node' + nodeId)
      .classed('highlighted-node', true);
  }

  public highlightLink(linkId: string): void {
    this.topologyVizService.getSvgObject().select('#link' + linkId)
      .classed('highlighted-link', true);
  }

  public selectLink(link: NetEdgeDataModel) {
    this.setTopologyOpacity(0.5);

    this.topologyVizService.getSvgObject().select('#link' + link.id)
      .classed('selected-link', true);
  }

  public highlightPathNode(nodeId: string): void {
    this.topologyVizService.getSvgObject().select('#node' + nodeId)
      .classed('path-node', true);
  }

  public highlightPathLink(linkId: string): void {
    this.topologyVizService.getSvgObject().select('#link' + linkId)
      .classed('path-link', true);
  }

  public highlightSelectedPathLink(linkId: string): void {
    this.topologyVizService.getSvgObject().select('#link' + linkId)
      .classed('selected-path-link', true);
  }

  public clearSelectedPathLink() {
    this.topologyVizService.getSvgObject().selectAll('.selected-path-link')
      .classed('selected-path-link', false);
  }

  private highlightPathBetweenNodes(node1: NetNodeDataModel, node2: NetNodeDataModel): void {
    const links = this.topologyService.getTopologyData().getNetLinksByNodes(node1, node2);

    links.forEach(link => {
      this.highlightLink(link.id);
    });
  }

  /**
   * Returns path between two nodes
   */
  private getSignalPath(nodeFrom: NetNodeDataModel, nodeTo: NetNodeDataModel): Array<NetNodeDataModel> {
    const nodeStack = [], visitedNodes = [];
    let path = [];

    const nodeFromWithPath: any  =  nodeFrom;
    nodeFromWithPath.path = [];
    nodeStack.push(nodeFromWithPath);

    for (let i = 0; i < nodeStack.length; i++) {
      visitedNodes.push(nodeStack[i].id);
      if (nodeStack[i].id === nodeTo.id) {
        nodeStack[i].path.push(nodeStack[i]);
        path.length = 0;
        path = nodeStack[i].path;
        break;
      } else {
        const neighboringNodes = this.topologyService.getTopologyData().getNeighboringNodes(nodeStack[i]);
        neighboringNodes.forEach(neighboringNode => {
          if (!visitedNodes.includes(neighboringNode.id)) {
            const neighboringNodeWithPath: any = neighboringNode;

            neighboringNodeWithPath.path = [];
            if (nodeStack[i].path && nodeStack[i].path.length > 0) {
              nodeStack[i].path.forEach(node => {
                  neighboringNodeWithPath.path.push(node);
              });
            }

            neighboringNodeWithPath.path.push(nodeStack[i]);
            nodeStack.push(neighboringNodeWithPath);
          }
        });
      }
    }

    return path;
  }

}
