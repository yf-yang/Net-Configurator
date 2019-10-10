import { Injectable } from '@angular/core';
import { NetTopologyDataModel } from '../net-topology-data/net-topology-data-model';
import { Subject } from 'rxjs';
import { TopologyService } from '../topology.service';
import { NotificationDialogService } from '../../notification-dialog/notification-dialog.service';

import { NetEdgeDataModel } from '../net-topology-data/net-edge-data-model';
import { SwitchModel } from '../net-topology-data/nodes/switch-model';
import { NetNodeDataModel } from '../net-topology-data/net-node-data-model';
import { EthDeviceModel } from '../net-topology-data/nodes/eth-device-model';
import { NodeData } from '../../shared/topology/interfaces/node-data';
import { DataService } from '../../shared/data.service';
import { IconSizes } from '../../shared/constants/icon-sizes';
import { ImportNodeDataModel } from './models/import-node-data-model';
import { ImportLinkDataModel } from './models/import-link-data-model';
import { EdgeData } from '../../shared/topology/interfaces/edge-data';
import { MessageModel } from '../../shared/models/messages/message-model';
import { IpMessageModel } from '../../shared/models/messages/ip-message-model';
import { CommonDeviceModel } from '../net-topology-data/nodes/deviceNodes/common-device-model';
import { ImportDataModel } from './models/import-data-model';
import { FileDataInterface } from './interfaces/file-data-interface';
import { FrontendImportDataModel } from './models/frontend-import-data-model';
import { TopologyVizService } from '../../topology-viz/topology-viz.service';

import { TopologyHighlightingService } from '../../shared/topology/services/topology-highlighting.service';
import { CoreService } from '../../shared/core.service';
import { SwitchData } from '../../shared/topology/interfaces/nodes/switch-data';
import { EthDeviceData } from '../../shared/topology/interfaces/nodes/eth-device-data';
import { MulticastGroupModel } from '../../shared/models/messages/multicast-group-model';

@Injectable({
  providedIn: 'root'
})
export class NetTopologyDataImportService {

  private topologyData: NetTopologyDataModel;
  private isModalOpen = false;
  private isModalOpenSubject = new Subject<boolean>();
  public isLoadingSubject = new Subject<boolean>();

  constructor(
    private topologyService: TopologyService,
    private notificationDialogService: NotificationDialogService,
    private dataService: DataService,
    private topologyVizService: TopologyVizService,
    private topologyHighlightingService: TopologyHighlightingService,
    private coreService: CoreService
  ) { }

  public clearData() {
    this.topologyData = new NetTopologyDataModel();
  }

  public openImportModal() {
    this.isModalOpen = true;
    this.isModalOpenSubject.next(this.isModalOpen);
  }

  public closeImportModal() {
    this.isModalOpen = false;
    this.isModalOpenSubject.next(this.isModalOpen);
  }

  public isOpenModal(): Subject<boolean> {
    return this.isModalOpenSubject;
  }

  public loadDataFromBackend() {
    this.isLoadingSubject.next(true);
    this.notificationDialogService.resetValidation();
    this.clearData();

    this.dataService.getAllData().subscribe(
      data => {
        this.setBandwidth();
        this.setDataFromBackend(data);
        this.topologyService.setTopologyData(this.topologyData);
        this.topologyService.updateLayout();
        this.isLoadingSubject.next(false);
      },
      error => {
        this.notificationDialogService.openErrorModal('Failed to load data from the backend.');
        this.isLoadingSubject.next(false);
      }
    );
  }

  public parseFile(file: File) {
    this.isLoadingSubject.next(true);
    this.notificationDialogService.resetValidation();
    this.clearData();

    this.dataService.importFile(file).subscribe(
      data => {
        // this.setBandwidth();
        this.setDataFromBackend(data);
        this.forceXlsLayout();
        this.topologyService.setTopologyData(this.topologyData);
        this.isLoadingSubject.next(false);
      },
      error => {
        this.notificationDialogService.openErrorModal('Failed to parse the file.');
        this.isLoadingSubject.next(false);
      }
    );
  }

  public loadDataFromJson(jsonData: FileDataInterface) {
    this.isLoadingSubject.next(true);
    this.notificationDialogService.resetValidation();
    this.clearData();

    this.dataService.setBackendData(jsonData.be).subscribe(
      res => {
        const backendData: ImportDataModel = new ImportDataModel(res);
        this.setDataFromBackend(backendData);

        const frontendData: FrontendImportDataModel = new FrontendImportDataModel(jsonData.fe);
        this.setDataFromJson(frontendData);

        this.topologyService.setTopologyData(this.topologyData);
        this.setBandwidth();
        this.isLoadingSubject.next(false);
      },
      error => {
        this.notificationDialogService.openErrorModal('Failed to load data from the file.');
        this.isLoadingSubject.next(false);
      }
    );
  }

  public setBandwidth() {
    this.coreService.isWorkingSubject.next(true);
    this.dataService.getBandwidth(this.topologyService.disabledLinkId).subscribe(res => {
      this.coreService.isWorkingSubject.next(false);
      this.topologyHighlightingService.clearErrorLinks();
      this.topologyService.getTopologyData().netLinks.forEach(l => {
        l.resetTraffic();
      });

      const errorLinks: NetEdgeDataModel[] = [];

      res.forEach(data => {
        const link = this.topologyService.getTopologyData().getNetLinkById(data.linkId);

        link.traffics = data.directions.map(bw => {
          const fromNode = this.topologyService.getTopologyData().getNetNodeById(bw.from);
          const toNode = this.topologyService.getTopologyData().getNetNodeById(bw.to);

          bw.setNodes(fromNode, toNode);

          bw.traffic.forEach(t => {
            const msg = this.topologyService.getTopologyData().getMessageById(t.trafficId);
            t.message = msg;
          });

          if (bw.isBandwidthOverload(link.speed)) {
            if (errorLinks.length === 0 || errorLinks[errorLinks.length - 1].id !== link.id) {
              errorLinks.push(link);
              this.topologyHighlightingService.highlightErrorLink(link.id);
            }
          }

          return bw;
        });
      });

      if (errorLinks.length > 1) {
        this.notificationDialogService.openErrorModal('Max bandwidth exceeded on ' + errorLinks.length + ' links.');
      } else if (errorLinks.length === 1) {
        this.notificationDialogService.openErrorModal('Max bandwidth exceeded on ' + errorLinks.length + ' link.');
      }
    },
    error => {
      this.coreService.isWorkingSubject.next(false);
      this.notificationDialogService.openErrorModal('Failed to load traffics bandwidth.');
    });
  }

  private setDataFromBackend(data: ImportDataModel) {
    this.topologyData.netNodes = data.nodes.map(importNode => this.createNodeFromBackend(importNode));
    this.topologyData.multicastGroups = data.multicastGroups;
    data.traffics.forEach(msg => this.setMessageFromBackend(msg, this.topologyData.netNodes, this.topologyData.multicastGroups));
    this.topologyData.netLinks = data.links.map(importLink => this.createLinkFromBackend(importLink, this.topologyData.netNodes));
  }

  private setDataFromJson(data: FrontendImportDataModel) {
    data.nodes.forEach(n => this.topologyData.getNetNodeById(n.id).setData(n));
    data.links.forEach(l => this.topologyData.getNetLinkById(l.id).setData(l));

    this.topologyVizService.setTopologyTransform(data.transform);
  }

  private createNodeFromBackend(node: ImportNodeDataModel): NetNodeDataModel {
    const icon = this.getNodeIcon(node);
    const newNode = this.createNodeModel(node, icon);

    return newNode;
  }

  private createLinkFromBackend(link: ImportLinkDataModel, nodes: NetNodeDataModel[]): NetEdgeDataModel {
    const fromNode = nodes.find(n => n.id === link.endpoints[0].nodeId);
    const toNode = nodes.find(n => n.id === link.endpoints[1].nodeId);

    const fromPortId = link.endpoints[0].portId;
    const toPortId = link.endpoints[1].portId;

    const fromPort = fromNode.ports.find(p => p.id === fromPortId);
    const toPort = toNode.ports.find(p => p.id === toPortId);

    const edgeData: EdgeData = {
      id: link.id,
      fromNodeObj: fromNode,
      toNodeObj: toNode,
      speed: link.bandwidth,
      protocol: link.protocol
    };

    const edge = new NetEdgeDataModel(edgeData);

    fromPort.setData(edge, toNode);
    toPort.setData(edge, fromNode);

    return edge;
  }

  private setMessageFromBackend(msg: MessageModel, nodes: NetNodeDataModel[], multicastGroups: MulticastGroupModel[]) {
    const fromNode = nodes.find(n => n.id === msg.getSourceId());
    let dstNodes: NetNodeDataModel[] = [];

    if (msg.getDestinationAddressMethod() === 'UNICAST') {
      dstNodes = nodes.filter(n => n.id === msg.getRawDestinationDeviceId());
    } else {
      const deviceIds = multicastGroups.find(mg => mg.id === msg.getMulticastGroupId()).devices;
      dstNodes = deviceIds.map(deviceId => nodes.find(n => n.id === deviceId));
    }

    if (fromNode) {
      msg.setSource(fromNode);
    }

    if (dstNodes) {
      msg.dstNodes = dstNodes;
    }

    if (msg instanceof IpMessageModel) {
      if (fromNode && fromNode instanceof EthDeviceModel) {
        fromNode.addIpMessage(msg);
      }
    }
  }

  private getNodeIcon(node: ImportNodeDataModel): string {
    switch (node.type) {
      case 'SWITCH':
        return '/assets/images/network-elements/switch.svg';
      case 'DEVICE':
        return '/assets/images/device/microchip.svg';
      default:
        return '/assets/images/device/microchip.svg';
    }
  }

  private createNodeModel(node: ImportNodeDataModel, icon: string): NetNodeDataModel {
    let newNode: NetNodeDataModel;

    const nodeData: NodeData = {
      id: node.id,
      label: node.name,
      icon: icon,
      iconWidth: IconSizes.DEVICE_SIZE,
      iconHeight: IconSizes.DEVICE_SIZE,
      type: 'topology-item',
      x: 0,
      y: 0,
      category: node.category,
    };

    if (node.type === 'SWITCH') {
      const data: SwitchData = Object.assign({
        IP: node.IP,
        MAC: node.MAC,
        role: node.role,
        ports: node.ports
      }, nodeData);

      newNode = new SwitchModel(data);
    } else {
      const ethData: EthDeviceData = Object.assign({
        IP: node.IP,
        MAC: node.MAC,
        traffics: []
      }, nodeData);

      ethData.traffics = ['IP'];
      newNode = new CommonDeviceModel(ethData);

    }

    return newNode;
  }

  private forceXlsLayout() {
    const offsetX = 150;
    const offsetY = 150;
    const itemsPerRow = 8;
    let column = 0;
    let row = 0;

    this.topologyData.netNodes.forEach((n, i) => {
      if (i % itemsPerRow === 0) {
        column = 0;
        row++;
      }

      column++;

      n.x = offsetX * column;
      n.y = offsetY * row;
    });
  }
}
