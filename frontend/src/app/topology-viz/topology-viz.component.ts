import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { BaseType } from 'd3-selection';
import { Subscription } from 'rxjs';

import { CoreService } from '../shared/core.service';
import { TopologyService } from '../topology/topology.service';
import { LinkConnectionDialogService } from '../link-connection-dialog/link-connection-dialog.service';
import { TopologyVizService } from './topology-viz.service';
import { NetNodeDataModel } from '../topology/net-topology-data/net-node-data-model';
import { NetEdgeDataModel } from '../topology/net-topology-data/net-edge-data-model';
import { RenderOptions } from '../shared/topology/interfaces/render-options';
import { LinkConnectionDialogComponent } from '../link-connection-dialog/link-connection-dialog.component';
import { Point } from '../shared/models/point';
import { LinkClickEvent } from '../shared/topology/interfaces/events/link-click-event';
import { NodeClickEvent } from '../shared/topology/interfaces/events/node-click-event';
import { SvgTransform } from '../shared/topology/interfaces/svg-transform';
import { LinkConnectedEvent } from '../shared/topology/interfaces/events/link-connected-event';
import { Collision, CollisionService } from './collision.service';
import { CommonDeviceModel } from '../topology/net-topology-data/nodes/deviceNodes/common-device-model';

import * as d3 from 'd3';

@Component({
  selector: 'app-topology-viz',
  templateUrl: './topology-viz.component.html',
  styleUrls: ['./topology-viz.component.scss']
})

export class TopologyVizComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('topology') topologyEl: ElementRef;
  @ViewChild('linkConnectionDialog') linkDialog: LinkConnectionDialogComponent;

  @Input() isLoading: boolean;

  @Output() nodeClicked = new EventEmitter<NodeClickEvent>();
  @Output() linkClicked = new EventEmitter<LinkClickEvent>();
  @Output() svgClicked = new EventEmitter<boolean>();
  @Output() transform = new EventEmitter<SvgTransform>();
  @Output() linkConnected = new EventEmitter<LinkConnectedEvent>();

  private isConnectionDialogOpenSubscribtion: Subscription;
  private svg: d3.Selection<SVGSVGElement, {}, null, undefined>;
  private dropNode: NetNodeDataModel;
  private dropLink: NetEdgeDataModel;
  private clickableLink: NetEdgeDataModel;
  private netTopologySubscription: Subscription;
  private isDraggingItem = false;
  private simulation: d3.Simulation<NetNodeDataModel, NetEdgeDataModel>;
  private collisions: Collision[] = [];

  constructor(private coreService: CoreService,
              private topologyService: TopologyService,
              private linkConnectionDialogService: LinkConnectionDialogService,
              private topologyVizService: TopologyVizService,
              private collisionService: CollisionService
            ) {
  }

  ngOnInit() {
    this.netTopologySubscription = this.topologyService.getTopologyDataObservable().subscribe(() => {
      this.collisions = [];
      this.renderTopology();
    });

    this.isConnectionDialogOpenSubscribtion = this.linkConnectionDialogService.isConnectionDialogOpenSubject.subscribe(
      item => {
        this.svg.select('.content').classed('disabled', item !== null);
      }
    );

    this.topologyService.updateLayoutSubject.subscribe(state => {
      if (state) {
        this.forceTopologyLayout();
      }
    });
  }

  ngAfterViewInit() {
    this.svg = d3.select(this.topologyEl.nativeElement);
    const svgG = this.svg.select('.content');
    const zoomBeh = d3.zoom<SVGSVGElement, any>()
      .scaleExtent([0.25, 8])
      .on('zoom', this.zoomHandle(svgG));

    this.svg.call(zoomBeh);

    this.svg.on('dblclick.zoom', null);
    this.svg.on('contextmenu', () => {
      d3.event.preventDefault();
    });

    this.topologyVizService.setSvgObject(this.svg);
    this.topologyVizService.setZoomBeh(zoomBeh);
    this.topologyVizService.setLinkDialogTransform(this.linkDialog);
  }

  private forceTopologyLayout() {
    const svgRect = this.svg.node().getBoundingClientRect();

    const links = this.svg.select('.links')
      .selectAll('.link')
      .data(this.topologyService.getTopologyData().netLinks);

    const nodes = this.svg.select('.nodes')
      .selectAll('.node')
      .data(this.topologyService.getTopologyData().netNodes);

    this.simulation = d3.forceSimulation<NetNodeDataModel, NetEdgeDataModel>(this.topologyService.getTopologyData().netNodes)
      .force('charge', d3.forceManyBody().strength(-15))
      .force('link', d3.forceLink<NetNodeDataModel, NetEdgeDataModel>(this.topologyService.getTopologyData().netLinks)
        .id(d => d.id)
        .distance(300)
      )
      .force('center', d3.forceCenter(svgRect.width / 2, svgRect.height / 2))
      .on('tick', this.ticked(links, nodes));
  }

  private ticked(links: d3.Selection<any, NetEdgeDataModel, any, {}>, nodes: d3.Selection<any, NetNodeDataModel, any, {}>) {
    const self = this;

    return function() {
      links.attr('d', (link: NetEdgeDataModel) => self.renderLinkPath(link));

      nodes
        .attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')');
    };
  }

  /**
   * Aggregated function for setting parameters and events to all topology items
   */
  private renderTopology() {
    this.renderLinks(this.topologyService.getTopologyData().netLinks, {selector: '.links'});
    this.renderNodes(this.topologyService.getTopologyData().netNodes, {selector: '.nodes'});
    this.appendEventsToTopologyItems();

    this.collisions = this.collisionService.checkCollisions(this.svg);

    if (this.collisions) {
      this.renderLinks(this.topologyService.getTopologyData().netLinks, {selector: '.links'});
    }
  }

  /**
   * Set parameters and events to link elements
   */
  private renderLinks(data: NetEdgeDataModel[], options: RenderOptions) {
    const links = this.svg.select(options.selector)
      .selectAll('.link')
      .data(data, function (l: NetEdgeDataModel) {
        return l.id;
      });

    const clickableLinks = this.svg.select(options.selector)
    .selectAll('.link-clickable')
    .data(data, function (l: NetEdgeDataModel) {
      return l.id + '-clickable';
    });

    links.exit().remove();
    clickableLinks.exit().remove();

    links.enter().append<BaseType>('path')
      .merge(links)
      .attr('id', d => 'link' + d.id)
      .attr('stroke', d => d.color)
      .attr('d', link => this.renderLinkPath(link, true))
      .attr('p1', link => {
        const perimeterPoints = link.getPerimeterPoints();
        return perimeterPoints[0].x + ' ' + perimeterPoints[0].y;
      })
      .attr('p2', link => {
        const perimeterPoints = link.getPerimeterPoints();
        return perimeterPoints[1].x + ' ' + perimeterPoints[1].y;
      })
      .attr('p3', link => {
        const angle = link.getLinkAngle();
        const perimeterPoints = link.getPerimeterPoints();
        const orthoPoint = link.getOrthogonalPoint(perimeterPoints[0], perimeterPoints[1], angle);
        return orthoPoint.x + ' ' + orthoPoint.y;
      })
      .classed('dashed', d => d.isDashed)
      .classed('disabled', d => !d.clickable)
      .classed('broken', d => d.disabled)
      .classed('link', true);

    clickableLinks.enter().append<BaseType>('path')
      .merge(clickableLinks)
      .attr('id', d => 'link' + d.id + '-clickable')
      .attr('d', link => this.renderLinkPath(link))
      .classed('link-clickable', true);
  }

  /**
   * Set parameters and events to node elements
   */
  private renderNodes(data: NetNodeDataModel[], options: RenderOptions) {
    const nodesData = this.svg.select(options.selector)
      .selectAll('.node')
      .data(data, function (n: NetNodeDataModel) {
        return 'node' + n.id;
      });

    // Remove old nodes
    nodesData.exit().remove();

    // Create new nodes
    const nodesEnterG = nodesData.enter().append<SVGGElement>('g');

    nodesEnterG.attr('id', d => 'node' + d.id)
      .attr('class', 'node')
      .attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')')
      .attr('type', d => d.type);

    nodesEnterG.append('image')
      .attr('href', (d) => d.icon)
      .attr('width', d => d.iconWidth)
      .attr('height', d => d.iconHeight)
      .attr('class', 'node-icon');

    nodesEnterG.append<SVGTextElement>('text')
      .attr('text-anchor', 'middle')
      .attr('dx', (d) => d.iconWidth / 2)
      .attr('dy', (d) => d.iconHeight + 20)
      .attr('class', 'node-text')
      .text((d) => d.label);

    nodesEnterG.append<SVGTextElement>('text')
      .attr('text-anchor', 'middle')
      .attr('dx', (d) => d.iconWidth / 2)
      .attr('dy', (d) => d.iconHeight / 2 + 6)
      .attr('class', 'device-label')
      .text((d) => d instanceof CommonDeviceModel ? d.label.charAt(0) : '');

    // Update nodes
    nodesData.attr('id', d => 'node' + d.id)
      .attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')')
      .attr('type', d => d.type);

    this.svg.select('.nodes').selectAll('.node-icon').data(data)
      .attr('href', (d) => d.icon);

    this.svg.select('.nodes').selectAll('.node-text').data(data)
      .attr('dx', (d) => d.iconWidth / 2)
      .attr('dy', (d) => d.iconHeight + 20)
      .text((d) => d.label);

    this.svg.select('.nodes').selectAll('.device-label').data(data)
      .attr('dx', (d) => d.iconWidth / 2)
      .attr('dy', (d) => d.iconHeight / 2 + 6)
      .text((d) => d instanceof CommonDeviceModel ? d.label.charAt(0) : '');
  }

  /**
   * Append events to nodes and links
   */
  private appendEventsToTopologyItems() {
    const self = this;

    // fill links to array for further use
    const links = this.svg.select('.links')
      .selectAll('.link')
      .data(this.topologyService.getTopologyData().netLinks)
      .on('mouseenter', d => this.dropLink = d)
      .on('mouseleave', d => this.dropLink = null)
      .on('contextmenu', function (link) {
        d3.event.preventDefault();
        link.flip();
        self.renderLinks(self.topologyService.getTopologyData().netLinks, {selector: '.links'});
      });

    const clickableLink = this.svg.select('.links')
      .selectAll('.link-clickable')
      .data(this.topologyService.getTopologyData().netLinks)
      .on('mouseenter', d => this.clickableLink = d)
      .on('mouseleave', d => this.clickableLink = null)
      .on('click', function (d) {
        if (d.clickable) {
          self.linkClicked.emit({
            netLink: d,
            svgLink: this
          });
        }
      })
      .on('contextmenu', function (link) {
        d3.event.preventDefault();
        link.flip();
        self.renderLinks(self.topologyService.getTopologyData().netLinks, {selector: '.links'});
      });

    // add events to topology nodes
    const nodes = this.svg.select('.nodes')
      .selectAll('.node')
      .data(this.topologyService.getTopologyData().netNodes);

    nodes.filter(d => d.type === 'topology-item')
      .on('click', function (d) {
        self.nodeClicked.emit({
          netNode: d,
          svgNode: this
        });
      })
      .on('mouseenter', n => this.dropNode = n)
      .on('mouseleave', n => this.dropNode = null)
      .call(d3.drag<SVGGElement, NetNodeDataModel>()
        .on('drag', this.dragHandle(links))
        .on('end', this.stopHandle())
      );

    // apply events on link drag endpoints
    this.svg.select('.nodes')
      .selectAll('.node')
      .data(this.topologyService.getTopologyData().netNodes)
      .filter(d => d.type.startsWith('link-drag-'))
      .call(d3.drag<SVGGElement, NetNodeDataModel>()
        .on('drag', this.dragHandle(links))
        .on('end', this.stopHandle())
      );
  }

  private zoomHandle(svgSelection) {
    const self = this;

    return function (this: SVGSVGElement) {
      const zoomEvent: d3.D3ZoomEvent<SVGSVGElement, any> = d3.event;
      svgSelection.attr('transform', zoomEvent.transform.toString());
      self.topologyVizService.setLinkDialogTransform(self.linkDialog);
      self.transform.emit(self.coreService.parseTransform(zoomEvent.transform.toString()));
    };
  }

  private dragHandle(link: d3.Selection<any, NetEdgeDataModel, any, {}>) {
    const self = this;

    return function (this: SVGGElement, d: NetNodeDataModel) {
      const dragEvent: d3.D3DragEvent<SVGGElement, NetNodeDataModel, any> = d3.event;
      self.isDraggingItem = true;

      d.x = dragEvent.x;
      d.y = dragEvent.y;

      const dragNode = d3.select(this)
        .attr('transform', 'translate(' + d.x + ',' + d.y + ')');

      if (!(dragEvent.dx === 0 || dragEvent.dy === 0) || d.type.startsWith('link-drag')) {
        dragNode.classed('node-dragging', true);
      }

      self.updateLinks(d, link);
    };
  }

  private stopHandle() {
    const self = this;

    return function (this: SVGGElement, d: NetNodeDataModel) {
      if (!self.isDraggingItem) {
        return;
      }

      self.isDraggingItem = false;

      d3.select(this).classed('node-dragging', false);
      d3.selectAll('.link-dragging').classed('link-dragging', false);

      if (self.dropNode && d.type.startsWith('link-drag')) {
        const link = self.topologyService.getTopologyData().netLinks
          .find(l => (l.from === d.id || l.to === d.id));

        const linkConnectionData: LinkConnectedEvent = {
          node: self.dropNode,
          controlNode: d,
          link: link
        };

        self.linkConnected.emit(linkConnectionData);
      }

      self.renderTopology();
    };
  }

  private updateLinks(d: NetNodeDataModel, links: d3.Selection<SVGLineElement, NetEdgeDataModel, BaseType, {}>) {
    const connectedLinks = links.filter(
      (link) => {
        return (d.id === link.from || d.id === link.to);
      }
    );

    connectedLinks
      .attr('d', link => this.renderLinkPath(link))
      .attr('p1', link => {
        const perimeterPoints = link.getPerimeterPoints();
        return perimeterPoints[0].x + ' ' + perimeterPoints[0].y;
      })
      .attr('p2', link => {
        const perimeterPoints = link.getPerimeterPoints();
        return perimeterPoints[1].x + ' ' + perimeterPoints[1].y;
      })
      .attr('p3', link => {
        const angle = link.getLinkAngle();
        const perimeterPoints = link.getPerimeterPoints();
        const orthoPoint = link.getOrthogonalPoint(perimeterPoints[0], perimeterPoints[1], angle);
        return orthoPoint.x + ' ' + orthoPoint.y;
      })
      .classed('link-dragging', true);
  }

  public checkSvgClick(e: Event) {
    e.stopPropagation();
    if (!this.isTopologyItemClicked()) {
      this.svgClicked.emit(true);
    }
  }

  private renderLinkPath(link: NetEdgeDataModel, checkCollisions?: boolean): string {
    let path = '';
    let collisionPath = '';
    const angle = link.getLinkAngle();

    const perimeterPoints = link.getPerimeterPoints();
    const orthoPoint = link.getOrthogonalPoint(perimeterPoints[0], perimeterPoints[1], angle);

    if (checkCollisions) {
      const collisions = this.collisions.filter(c => c.hLineId === link.id);
      collisionPath = this.collisionService.getCollisionPath(perimeterPoints[0], perimeterPoints[1], collisions);
    }

    const fromPos: Point = {
      x: link.fromNodeObj.x + link.fromNodeObj.iconWidth / 2,
      y: link.fromNodeObj.y + link.fromNodeObj.iconHeight / 2
    };

    const toPos: Point = {
      x: link.toNodeObj.x + link.toNodeObj.iconWidth / 2,
      y: link.toNodeObj.y + link.toNodeObj.iconHeight / 2
    };

    path += 'M' + fromPos.x + ' ' + fromPos.y;
    path += ' L' + perimeterPoints[0].x + ' ' + perimeterPoints[0].y;

    if (link.isFlipped) {
      path += collisionPath;
    }

    path += ' L' + orthoPoint.x + ' ' + orthoPoint.y;

    if (!link.isFlipped) {
      path += collisionPath;
    }

    path += ' L' + perimeterPoints[1].x + ' ' + perimeterPoints[1].y;
    path += ' L' + toPos.x + ' ' + toPos.y;

    return path;
  }

  private isTopologyItemClicked(): boolean {
    if (this.dropNode || this.dropLink || this.clickableLink) {
      return true;
    } else {
      return false;
    }
  }

  ngOnDestroy(): void {
    if (this.netTopologySubscription) {
      this.netTopologySubscription.unsubscribe();
    }

    if (this.isConnectionDialogOpenSubscribtion) {
      this.isConnectionDialogOpenSubscribtion.unsubscribe();
    }
  }

}
